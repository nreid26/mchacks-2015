var Ex = {};

Ex.tileColors = Object.freeze({EMPTY: '333333', DEAD: 'FFA500', HOSTILE: 'FA3296', FRIENDLY: '39C8FF'});
Ex.taskCodes = Object.freeze({MOVE: 1, ATTACK: 2, ASSIMILATE: 3, LOOK: 4, PASS: 5});
Ex.taskFunctions = Object.freeze({
    MOVE: Object.freeze(function(i) { return {task: Ex.taskCodes.MOVE, param: i}; }),
    ATTACK: Object.freeze(function(i) { return {task: Ex.taskCodes.ATTACK, param: i}; }),
    ASSIMILATE: Object.freeze(function(i) { return {task: Ex.taskCodes.ASSIMILATE, param: i}; }),
    LOOK: Object.freeze(function(i) { return {task: Ex.taskCodes.LOOK, param: i}; }),
    PASS: Object.freeze(function() { return {task: Ex.taskCodes.ASSIMILATE, param: 1}; }),
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


Ex.HexCell= Em.Object.extend({
    position: 0,
    tile: null,
    adjacent: null,

    color: function() { return this.get('tile.team.color') || (this.get('tile') ? Ex.tileColors.DEAD : Ex.tileColors.EMPTY); }.property('tile.team.color'),
    style: function() { return 'background-color: #' + this.get('color') + ';'; }.property('color'),

    init: function() {
        this._super();
        this.set('adjacent', []);
    }
});

Ex.HexMap = Em.Object.extend({
    all: null,
    organized: null,
    edge: 9,
    tileCount: 0,

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

Ex.Team = Ex.CyclicList.extend({
    script: null,
    first: null, //The first tile to exist when the team is instantiated
    size: function() { return this.get('list.length'); }.property('list.length'),
    group: null,
    color: '',
    name: '',
    proxy: null,

    run: function() {
        var map = this.get('group.hexMap.all'),
            tile = this.get('active');

        return this.get('script').call(
            tile.get('proxy'),

            this.get('proxy'),
            tile.get('position'),

            Ex.taskFunctions.MOVE,
            Ex.taskFunctions.ATTACK,
            Ex.taskFunctions.ASSIMILATE,
            Ex.taskFunctions.LOOK,
            Ex.taskFunctions.PASS
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
        this.setProperties({
            list: [tile],
            proxy: {}
        });
    }
});

Ex.TeamGroup = Ex.CyclicList.extend({
    hexMap: null,

    forEach: function(callback, target) { return this.get('list').forEach(callback, target); },
    winner: function() {
        var rem = this.get('list').filter(function(item) { return item.get('size') > 0; });
        if(rem.length > 1) { return null; }
        return rem[0].get('name');
    }.property('list.@each.size'),

    init: function() {
        this._super();
        this.set('proxy', {});

        this.get('list').forEach( function(team) { team.set('group', this); }, this);
    }
});


Ex.editor = Em.Object.create({data: "function randInt(a) { return Math.floor(Math.random() * a); }\n\nif(!this.init) {\n\tthis.init = true;\n\tthis.dir = 0;\n\tthis.tasks = [move, attack, assimilate];\n}\n\nthis.dir = (this.dir + 1) % 6;\nreturn this.tasks[randInt(3)](this.dir);"});

Ex.map;

Ex.AIScript = function() {
    function int(a) { return Math.floor(Math.random() * a); }
    return {task: int(5) + 1, param: int(6)}; 
};

Ex.executeAction = function(teams) {
    var aTeam = teams.get('active');

    //Pass
    var command = aTeam.run();
    if(!command || !command.task) { return; }
    while(command.task == Ex.taskCodes.PASS) {
        aTeam.advance();
        command = aTeam.run();
        if(!command || !command.task) { return; }
    }

    //Look
    var aTile = aTeam.get('active');
    if(command.task == Ex.taskCodes.LOOK) {
        if(typeof command.param === 'function') { 
            command.param.call(
                aTile.get('proxy'),
                aTile.get('cell.adjacent').mapBy('color')
            );
        }
        return;
    }

    //Move, Attack, Assimilate
    if(typeof command.param !== 'number') { return; }
    command.param = (Math.floor(command.param) % 6 + 6) % 6; //Accept any number
    var nextCell = aTile.get('cell.adjacent')[command.param],
        bTile = nextCell.get('tile')
    if(command.task == Ex.taskCodes.MOVE && !bTile) {
        aTile.set('cell.tile', null);
        aTile.set('cell', nextCell);
        nextCell.set('tile', aTile);
    }
    else if(command.task == Ex.taskCodes.ATTACK && bTile) {
        bTile.kill();
    }
    else if(command.task == Ex.taskCodes.ASSIMILATE && bTile) {
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