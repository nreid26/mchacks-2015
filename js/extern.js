var Ex = {};

Ex.tileTypes = Object.freeze({EMPTY: 'empty', DEAD: 'dead', HOSTILE: 'hostile', FRIENDLY: 'friendly'});
Ex.tasks = Object.freeze({MOVE: 'move', ATTACK: 'attack', ASSIMILATE: 'assimilate'});

Ex.HexCell= Em.Object.extend({
    position: 0,
    tile: null,
    adjacent: new Array(6),

    css: function() {
        if(this.get('tile.team.type')) { return this.get('tile.team.type') }
        else if(this.get('tile'))      { return Ex.tileTypes.DEAD; }
        else                           { return Ex.tileTypes.EMPTY; } 
    }.property('tile.team.type')
});

Ex.HexMap = Em.Object.extend({
    all: [],
    organized: [],
    edge: 6,

    clear: function() { this.get('all').each( function() { this.set('tile', null); } ); },
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
                cell.set('tile', Ex.Tile.create({cell: cell}) );
                dead--;

                if(players-- > 0) { ret.pushObject(cell); }
            }
        }
        
        if(players >= 0) { throw Error('Unable to return requested number of players'); }
        return ret;
    },
    init: function() {
        var all = this.get('all'),
            org = this.get('organized'),
            edge = this.get('edge') - 1;

        var i, k, row, cell, len;
        function last(arr) { return arr[arr.length - 1]; }

        //Construct and organize cells
        for(i = -edge; Math.abs(i) <= edge; i++) {
            row = [];
            for(k = 2 * edge - Math.abs(i); k >= 0; k--) {
                cell = Ex.HexCell.create({position: all.legnth});
                row.pushObject(cell);
                all.pushObject(cell);
            }
            org.pushObject(row);
        }
        
        //Create expansion map for linking adjacencies
        var exp = [org[0].slice()];
        for(i = 0; i < org.length; i++) { exp.push(org[i].slice()); }
        exp.push( last(org).slice() );

        for(i = 0; i <= edge; i++) { 
            exp[i].unshift(last(org[edge + i]) ); //Bottom right -> top left
            exp[i + 1].push(org[edge + i][0]); //Bottpm left -> top right
            exp[edge + i + 1].unshift(last(org[i]) ); //Top right -> bottom left
            exp[edge + i + 2].push(org[i][0]); //Top left -> bottom right
        }

        //Link up adjacencies
        for(i = 1; i <= org.length; i++) {
            row = exp[i];
            for(k = 1; k < row.length - 1; k++) {
                cell = row[k];

                try { cell.adjacent[0] = exp[i - 1][k + (i <= edge) ? 0 : 1]; } catch(e) { }
                try { cell.adjacent[1] = exp[i]    [k + 1];                   } catch(e) { }
                try { cell.adjacent[2] = exp[i + 1][k + (i >= edge) ? 0 : 1]; } catch(e) { }
                try { cell.adjacent[3] = exp[i + 1][k - (i >= edge) ? 1 : 0]; } catch(e) { }
                try { cell.adjacent[4] = exp[i]    [k - 1];                   } catch(e) { }
                try { cell.adjacent[5] = exp[i - 1][k - (i <= edge) ? 1 : 0]; } catch(e) { }
            }
        }      
    }
});

Ex.Tile = Em.Object.extend({
    team: null,
    cell: null,
    proxy: {},

    position: function() { return this.get('cell.position'); }.property('cell.position'),
    adjacentCells: function() { return this.get('cell.adjacent'); }.property('cell.adjacent'),
    adjacentTypes: function() { return this.get('adjacentCells').map( function(cell) { return cell.get('css'); } ); }.property('adjacentCells.@each.css')
});

Ex.TeamGroup = Em.Object.extend({
    index: 0,
    hexMap: null,
    teams: [],

    team: function() { return this.get('teams').objectAt(this.get('index')); }.property('index'),
    nextTeam: function() { this.set('index', ++this.get('index') % this.get('length')); },

    init: function() {
        this.get('teams').forEach( function(team) { team.set('group', this); }, this);
    }
});

Ex.Team = Em.Object.extend({
    index: 0,
    script: null,
    tiles: [], //The set of all tiles
    first: null, //The first tile to exist when the team is instantiated
    group: null,
    type: '',
    name: '',

    run: function() {
        var map = this.get('group.hexMap.all'),
            tile = this.get('tile');

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
    tile: function() { return this.get('tiles').objectAt(this.get('index')); }.property('index', 'tiles'),
    nextTile: function() {
        var i = this.get('index'), p = this.get('tiles');
        this.set('index', (i >= p.length) ? 0 : i);
    },
    remove: function(tile) {
        var i = this.indexOf(tile);
        this.splice(i, 1);
    },

    init: function() {
        var tile = this.get('first');

        tile.set('team', this);
        this.get('tiles').pushObject(tile);
    }
});

Ex.editor = Em.Object.create({data: "function randInt(a) { return Math.floor(Math.random() * a); }\n\nif(!this.init) {\n\tthis.init = true;\n\tthis.dir = 0;\n\tthis.tasks = ['move', 'attack', 'assimilate'];\n}\n\nthis.dir = (this.dir + 1) % 6;\nthis[this.tasks[randInt(3)]](this.dir);"});

Ex.map = Ex.HexMap.create();

Ex.AIScript = function() {
    function int(a) { return Math.round(Math.random() * a); }
    var moves = ['attack', 'assimilate', 'move'];
    return {task: moves[int(2)], param: int(5)+1}; 
};

Ex.executeAction = function(teams) {
    var command = teams.get('team').run();
        command.param = command.param % 6;

    var aTeam = teams.get('team'),
        aTile = aTeam.get('tile'),
        nextCell = aTile.get('adjacentCells')[command.param];

    //Do the thing
    if(command.task == Ex.tasks.MOVE && nextCell.get('tile') == null) {
        aTile.set('cell.tile', null);
        aTile.set('cell', nextCell);
        nextCell.set('tile', aTile);
    }
    else if(command.task == Ex.tasks.ATTACK && nextCell.get('tile') != null) {
        var bTile = nextCell.get('tile');
        teams.forEach( function(team) { team.remove(bTile); } );
        bTile.set('team', null);
    }
    else if(command.task == Ex.tasks.ASSIMILATE && nextCell.get('tile') != null) {
        var bTile = nextCell.get('tile'),
            bTeam = bTile.get('team');

        if(bTeam == null) {
            bTile.set('team', aTeam);
            aTeam.pushObject(bTile);
        }
        else if(bTeam != aTeam) {
            aTeam.remove(aTile);
            aTile.set('team', null);
        }
    }
}