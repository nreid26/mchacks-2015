var Ex = {};

Ex.tileTypes = Object.freeze({EMPTY: 'empty', DEAD: 'dead', HOSTILE: 'hostile', FRIENDLY: 'friendly'});
Ex.tasks = Object.freeze({MOVE: 'move', ATTACK: 'attack', ASSIMILATE: 'assimilate'});

Ex.HexCell= Em.Object.extend({
    position: 0,
    tile: null,
    adjacent: null,
    touch: false,

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
    edge: 6,

    clear: function() { this.get('all').forEach( function(cell) { cell.set('tile', null); } ); },
    prepare: function(players) {
        var all = this.get('all'),
            org = this.get('organized'),
            start = Math.floor(all.length / 4),
            dead = Math.floor(all.length * 0.2),
            ret = [];

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

    init: function() { this.set('proxy', {}); }
});

Ex.CyclicList = Em.Object.extend({
    list: null,
    index: 0,

    active: function() { return this.get('list').objectAt(this.get('index')); }.property('index', 'list'),
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
    group: null,
    type: '',
    name: '',

    run: function() {
        var map = this.get('group.hexMap.all'),
            tile = this.get('active');

        return this.get('script').call(
            tile.get('proxy'),
            this.get('tiles.length'),
            tile.get('position'),
            tile.get('cell.adjacentTypes'),
            function(i) { return {task: Ex.tasks.MOVE,       param: i}; },
            function(i) { return {task: Ex.tasks.ATTACK,     param: i}; },
            function(i) { return {task: Ex.tasks.ASSIMILATE, param: i}; }
        );
    },
    advance: function() {
        var i = this.get('index');
        this.set('index', (i >= this.get('list.length')) ? 0 : i);
    },
    remove: function(tile) {
        var i = this.indexOf(tile);
        this.splice(i, 1);
    },

    init: function() {
        var tile = this.get('first');

        tile.set('team', this);
        this.get('list').pushObject(tile);
    }
});

Ex.editor = Em.Object.create({data: "function randInt(a) { return Math.floor(Math.random() * a); }\n\nif(!this.init) {\n\tthis.init = true;\n\tthis.dir = 0;\n\tthis.tasks = [move, attack, assimilate];\n}\n\nthis.dir = (this.dir + 1) % 6;\nreturn this.tasks[randInt(3)](this.dir);"});

Ex.map = Ex.HexMap.create();

Ex.AIScript = function() {
    function int(a) { return Math.round(Math.random() * a); }
    var moves = ['attack', 'assimilate', 'move'];
    return {task: moves[int(2)], param: int(5)+1}; 
};

Ex.executeAction = function(teams) {
    var aTeam = teams.get('active'),
        command = aTeam.run(),
        aTile = aTeam.get('active'),
        nextCell = aTile.get('adjacentCells')[command.param],
        nextTile = nextCell.get('tile')

    //Sanity check
    if(!command || !command.task || !command.param) { return; }
    command.param = command.param % 6;

debugger;

    //Do the thing
    if(command.task == Ex.tasks.MOVE && !nextTile) {
        aTile.set('cell.tile', null);
        aTile.set('cell', nextCell);
        nextCell.set('tile', aTile);
    }
    else if(command.task == Ex.tasks.ATTACK && nextTile) {
        var bTile = nextCell.get('tile');
        teams.forEach( function(team) { team.remove(bTile); } );
        bTile.set('team', null);
    }
    else if(command.task == Ex.tasks.ASSIMILATE && nextTile) {
        var bTile = nextTile,
            bTeam = bTile.get('team');

        if(!bTeam) {
            bTile.set('team', aTeam);
            aTeam.pushObject(bTile);
        }
        else if(bTeam != aTeam) {
            aTeam.remove(aTile);
            aTile.set('team', null);
        }
    }
}