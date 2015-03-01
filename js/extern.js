var Ex = {};

Ex.tileTypes = Object.freeze({EMPTY: 'empty', DEAD: 'dead', HOSTILE: 'hostile', FRIENDLY: 'friendly'});
Ex.taskNames = Object.freeze({MOVE: 'move', ATTACK: 'attack', ASSIMILATE: 'assimilate'});
Ex.taskFunctions = Object.freeze({
    MOVE: Object.freeze(function(i) { return {task: Ex.taskNames.MOVE, param: i}; }),
    ATTACK: Object.freeze(function(i) { return {task: Ex.taskNames.ATTACK, param: i}; }),
    ASSIMILATE: Object.freeze(function(i) { return {task: Ex.taskNames.ASSIMILATE, param: i}; }),
});

Ex.HexCell= Em.Object.extend({
    position: 0,
    tile: null,
    adjacent: null,
    tileCount: 0,

    css: function() {
        if(this.get('tile.team.type')) { return this.get('tile.team.type') }
        else if(this.get('tile'))      { return Ex.tileTypes.DEAD; }
        else                           { return Ex.tileTypes.EMPTY; } 
    }.property('tile.team.type'),

    init: function() {
        this._super();
        this.set('adjacent', []);
    }
});

Ex.HexMap = Em.Object.extend({
    all: null,
    organized: null,
    edge: 9,

    clear: function() { this.get('all').forEach( function(cell) { cell.set('tile', null); } ); },
    prepare: function(players) {
        var all = this.get('all'),
            org = this.get('organized'),
            start = Math.floor(all.length / 4),
            dead = Math.floor(all.length * 0.2),
            ret = [];

        this.set('tileCount', dead);

        this.clear();
        this.all[start].set('tile', ret[0]);
        this.all[all.length - 1 - start].set('tile', ret[1]);

        while(dead > 0) { //Populate rnadom cells with the dead
            var cell = all[ Math.floor(Math.random() * all.length) ]; //A random cell

            if(cell.get('tile') == null) {
                var tile = Ex.Tile.create({cell: cell});
                cell.set('tile', tile);
                dead--;

                if(players-- > 0) { ret.pushObject(tile); }
            }
        }
        
        if(players >= 0) { throw Error('Unable to return requested number of players'); }
        return ret;
    },

    init: function() {
        this._super();
        this.setProperties({
            all: [],
            organized: []
        });

        var all = this.get('all'),
            org = this.get('organized'),
            edge = this.get('edge') - 1;

        var i, k, row, cell, len;
        function last(arr) { return arr[arr.length - 1]; }

        //Construct and organize cells
        for(i = -edge; Math.abs(i) <= edge; i++) {
            row = [];
            for(k = 2 * edge - Math.abs(i); k >= 0; k--) {
                cell = Ex.HexCell.create({position: all.length});
                row.pushObject(cell);
                all.pushObject(cell);
            }
            org.pushObject(row);
        }
        
        //Create expansion map for linking adjacencies
        var exp = [last(org).slice()];
        for(i = 0; i < org.length; i++) { exp.push(org[i].slice()); }
        exp.push( org[0].slice() );

        for(i = 0; i <= edge; i++) { 
            exp[i].unshift(last(org[edge + i]) ); //Bottom right -> top left
            exp[i + 1].push(org[edge + i][0]); //Bottpm left -> top right
            exp[edge + i + 1].unshift(last(org[i]) ); //Top right -> bottom left
            exp[edge + i + 2].push(org[i][0]); //Top left -> bottom right
        }

        //Link up adjacencies
        edge++;
        for(i = 1; i < exp.length - 1; i++) {
            row = exp[i];
            for(k = 1; k < row.length - 1; k++) {
                var adj = row[k].get('adjacent');

                adj.pushObject( exp[i - 1][k + (i <= edge ? 0 : 1)] );
                adj.pushObject( exp[i]    [k + 1] );                   
                adj.pushObject( exp[i + 1][k + (i >= edge ? 0 : 1)] ); 
                adj.pushObject( exp[i + 1][k - (i >= edge ? 1 : 0)] ); 
                adj.pushObject( exp[i]    [k - 1] );                   
                adj.pushObject( exp[i - 1][k - (i <= edge ? 1 : 0)] ); 
            }
        } 
    }
});

Ex.Tile = Em.Object.extend({
    team: null,
    cell: null,
    proxy: null,

    position: function() { return this.get('cell.position'); }.property('cell.position'),
    adjacentCells: function() { return this.get('cell.adjacent'); }.property('cell.adjacent'),
    adjacentTypes: function() { return this.get('adjacentCells').map( function(cell) { return cell.get('css'); } ); }.property('adjacentCells.@each.css'),
    kill: function() {
        var team = this.get('team');

        if(team) {
            team.remove(this);
            this.setProperties({
                proxy: {},
                team: null
            });
        }
    },

    init: function() { this.set('proxy', {}); }
});

Ex.CyclicList = Em.Object.extend({
    list: null,
    index: 0,

    active: function() { 
        if(!this.get('list').objectAt(this.get('index'))) { this.advance(); }
        return this.get('list').objectAt(this.get('index'));
    }.property('index', 'list'),
    advance: function() { this.set('index', (this.get('index') + 1) % this.get('list.length')); },

    init: function() { if(!this.get('list')) { this.set('list', []); } }
});

Ex.TeamGroup = Ex.CyclicList.extend({
    hexMap: null,

    filter: function(predicate) { return this.get('list').filter(predicate); },
    forEach: function(callback, target) { return this.get('list').forEach(callback, target); },

    init: function() {
        this._super();
        this.set('proxy', {});

        this.get('list').forEach( function(team) { team.set('group', this); }, this);
    }
});

Ex.Team = Ex.CyclicList.extend({
    script: null,
    first: null, //The first tile to exist when the team is instantiated
    size: function() { return this.get('list.length'); }.property('list.length'),
    group: null,
    type: '',
    name: '',

    run: function() {
        var map = this.get('group.hexMap.all'),
            tile = this.get('active');

        return this.get('script').call(
            tile.get('proxy'),

            this.get('size'),
            this.get('index'),
            tile.get('position'),
            tile.get('adjacentTypes').slice(),
            Ex.taskFunctions.MOVE,
            Ex.taskFunctions.ATTACK,
            Ex.taskFunctions.ASSIMILATE
        );
    },
    advance: function() {
        var i = this.get('index');
        this.set('index', (i >= this.get('list.length')) ? 0 : i + 1);
    },
    remove: function(tile) {
        this.get('list').removeObject(tile);
    },
    push: function(tile) {
        this.get('list').pushObject(tile);
    },

    init: function() {
        var tile = this.get('first');

        tile.set('team', this);
        this.set('list', [tile]);
    }
});

Ex.editor = Em.Object.create({data: "function randInt(a) { return Math.floor(Math.random() * a); }\n\nif(!this.init) {\n\tthis.init = true;\n\tthis.dir = 0;\n\tthis.tasks = [move, attack, assimilate];\n}\n\nthis.dir = (this.dir + 1) % 6;\nreturn this.tasks[randInt(3)](this.dir);"});

Ex.map;

Ex.AIScript = function() {
    function int(a) { return Math.round(Math.random() * a); }
    var moves = ['attack', 'assimilate', 'move'];
    return {task: moves[int(2)], param: int(5)}; 
};

Ex.executeAction = function(teams) {
    var aTeam = teams.get('active'),
        command = aTeam.run();

    //Sanity check
    if(!command || !command.task || typeof command.param !== 'number') { return; }
    command.param = (command.param % 6 + 6) % 6;

    var aTile = aTeam.get('active'),
        nextCell = aTile.get('adjacentCells')[command.param],
        bTile = nextCell.get('tile')

    //Do the thing
    if(command.task == Ex.taskNames.MOVE && !bTile) {
        aTile.set('cell.tile', null);
        aTile.set('cell', nextCell);
        nextCell.set('tile', aTile);
    }
    else if(command.task == Ex.taskNames.ATTACK && bTile) {
        bTile.kill();
    }
    else if(command.task == Ex.taskNames.ASSIMILATE && bTile) {
        var bTeam = bTile.get('team');

        if(!bTeam) { //If the adjacent tile has no team
            bTile.set('team', aTeam);
            aTeam.push(bTile);
        }
        else if(bTeam != aTeam) { //If the other tile is an enemy
            aTile.kill();
        }
    }
}