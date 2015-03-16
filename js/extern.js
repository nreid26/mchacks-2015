var Ex = {};
Ex.tileColors = Object.freeze({EMPTY: '333333', DEAD: 'FFA500', HOSTILE: 'FA3296', FRIENDLY: '39C8FF'});
Ex.messageCodes = Object.freeze({ANIMATE: 1, KILL: 2, RUN: 3, CREATE: 4});
Ex.taskCodes = Object.freeze({MOVE: 1, ATTACK: 2, ASSIMILATE: 3, LOOK: 4, NULL: 6});


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
            count = Math.floor(all.length * 0.2),
            ret = [];

        this.set('tileCount', count);
        this.clear();

        while(count > 0) { //Populate rnadom cells with the dead
            var cell = all[ Math.floor(Math.random() * all.length) ]; //A random cell

            if(cell.get('tile') == null) {
                var tile = Ex.Tile.create({cell: cell, id: count--});
                cell.set('tile', tile);
                if(players-- > 0) { ret.pushObject(tile); }
            }
        }
        
        if(players > 0) { throw Error('Unable to return requested number of players'); }
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

        function last(arr) { return arr[arr.length - 1]; }

        //Construct and organize cells
        for(var i = -edge; Math.abs(i) <= edge; i++) {
            var row = [];
            for(var k = 2 * edge - Math.abs(i); k >= 0; k--) {
                cell = Ex.HexCell.create({position: all.length});
                row.pushObject(cell);
                all.pushObject(cell);
            }
            org.pushObject(row);
        }
        
        //Create expansion map for linking adjacencies
        var exp = [last(org).slice()];
        for(var i = 0; i < org.length; i++) { exp.push(org[i].slice()); }
        exp.push( org[0].slice() );

        for(var i = 0; i <= edge; i++) { 
            exp[i].unshift(last(org[edge + i]) ); //Bottom right -> top left
            exp[i + 1].push(org[edge + i][0]); //Bottpm left -> top right
            exp[edge + i + 1].unshift(last(org[i]) ); //Top right -> bottom left
            exp[edge + i + 2].push(org[i][0]); //Top left -> bottom right
        }

        //Link up adjacencies
        edge++;
        for(var i = 1; i < exp.length - 1; i++) {
            row = exp[i];
            for(var k = 1; k < row.length - 1; k++) {
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
    id: 0,

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
});

Ex.Team = Em.Object.extend({
    size: function() { return this.get('tiles.length'); }.property('tiles.length'),
    group: null,
    color: '',
    name: '',
    worker: null,
    script: '',
    command: null,
    error: null,
    tiles: null,

    run: function() {
        var tile = this.get('tiles').objectAt(Math.randInt(this.get('size')));

        this.get('worker').postMessage({
            type: Ex.messageCodes.RUN,
            id: tile.get('id'),
            surroundings: tile.get('cell.adjacent').mapBy('color')
        });
    },
    remove: function(tile) { 
        this.get('tiles').removeObject(tile);
        this.get('worker').postMessage({type: Ex.messageCodes.KILL, id: tile.get('id')});
    },
    add: function(tile) {
        this.get('tiles').pushObject(tile);
        this.get('worker').postMessage({type: Ex.messageCodes.ANIMATE, id: tile.get('id')});
    },
    terminate: function()  { this.get('worker').terminate(); },

    init: function() {
        var tile = this.get('tiles').objectAt(0),
            worker = new Worker('sandbox.js'),
            _this = this;

        worker.onmessage = function(event) { _this.set('command', event.data); };
        worker.onerror = function(event) { _this.set('error', event.message); };
        worker.postMessage({type: Ex.messageCodes.CREATE, text: this.get('script')});

        this._super();
        tile.set('team', this);
        this.set('worker', worker);
    }
});

Ex.TeamGroup = Em.Object.extend({
    hexMap: null,
    teams: null,
    index: 0,

    winner: function() {
        var rem = this.get('teams').filter(function(item) { return item.get('size') > 0; });
        if(rem.length > 1) { return null; }
        return rem[0].get('name');
    }.property('teams.@each.size'),
    active: function() {
        return this.get('teams').objectAt(this.get('index'));
    }.property('index', 'teams'),

    forEach: function(callback, target) { 
        return this.get('teams').forEach(callback, target);
    },
    terminate: function() {
        this.get('teams').forEach(function(team) { team.terminate(); });
    },
    advance: function() {
        var i = this.get('index');
        if(++i >= this.get('teams.length')) { i = 0; }
        this.set('index', i);
    },

    init: function() {
        this._super();
        this.get('teams').forEach( function(team) { team.set('group', this); }, this);
    }
});


Ex.editor = Em.Object.create({data: null});

Ex.AIScript = 'function int(a) { return Math.floor(Math.random() * a); } return {task: int(5) + 1, param: int(6)};';

Ex.executeAction = function(team, command) {
    //Validation
    if(
        typeof command.task != 'number' ||
        typeof command.param != 'number' ||
        !team.get('tiles')[command.index]
    )
    { throw new Error('A malformed command has been issued'); }

    if(command.task == Ex.taskCodes.LOOK) { return; } //Nothing to do

    command.param = (Math.floor(command.param) % 6 + 6) % 6; //Accept any number
    var nextCell = aTile.get('cell.adjacent')[command.param],
        bTile = nextCell.get('tile')

    //MOVE, ATTACK, ASSIMILATE
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