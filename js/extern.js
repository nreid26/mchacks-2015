var Ex = {},
    statesToNames = {0: 'empty', 1: 'dead', 3: 'mine', 4: 'yours', 5: 'unknown', 6: 'null'},
    namesToStates = {'empty': 0, 'dead': 1, 'mine': 3, 'yours': 4, 'unknown': 5, 'null': 6};

Ex.HexCell= Em.Object.extend({
    state: 0,
    class: function() { return cellStates.objectAt(this.get('state')); }.property('state')
})
Ex.HexCellMirror = Ex.HexCell.extend({
    base: null,
    enabled: false,
    state: function() { return (this.get('enabled') && this.get('base.state')) ? this.get('base.state') : 5; }.property('base.state', 'enabled')
});

Ex.HexMap = Em.Object.extend({
    map: null,
    width: 11,
    height: 11,
    defaultState: 0,

    myTeamId: function() { statesToNames['mine']; },
    yourTeamId: function() { statesToNames['yours']; },
    cellAt: function(x, y) { 
        return this.get('map').objectAt(
            x + this.get('width') * y
        );
    },
    arround: function arround(x, y) {
        var arround = [];
        arround.push( map.cellAt(x + (y % 2), y - 1) );
        arround.push( map.cellAt(x + 1, y) );
        arround.push( map.cellAt(x + (y % 2), y + 1) );
        arround.push( map.cellAt(x + (y % 2) - 1, y - 1) );
        arround.push( map.cellAt(x - 1, y) );
        arround.push( map.cellAt(x, y - (y % 2)) );
        return arround;
    },
    clear: function() {
        var map = this.get('map'), def = this.get('defaultState');
        for(var i = 0; i < map.length; i++) { 
            if(map[i].get('state') != 5) { map[i].set('state', def); }
        }
    },
    prepare: function() {
        var w = this.get('width'),
            h = this.get('height'),
            numOthers = Math.round(w * h * 0.15); //Percentage of the map that's dead

        this.clear();
        this.cellAt(5,3).set('state', 2); //Player 1
        this.cellAt(5,7).set('state', 3); //Player 2

        for(var i = 0; i < numOthers; i++) {
            var x = Math.floor(Math.random() * (w - 1));
            var y = Math.floor(Math.random() * (h - 1));

            //check that cell is ok
            if(this.cellAt(x,y).state == 0) { this.cellAt(x,y).set('state', 1); } 
            else { i--; }
        }
    },


    init: function() {
        var map = [], removal = [3,2,2,1,1,0,1,1,2,2,3];
        for(var x = 0; x < this.get('height'); x++) {
            for(var y = 0; y < this.get('width'); y++) {  
                map.pushObject(Ex.HexCell.create({state: 
                    (removal[x] > y || (x < 6 && x+5+removal[x] < y) || (x >= 6 && 15-x+removal[x] < y)) ? 5 : this.get('defaultState')
                }));
            }
        }
        this.set('map', map);
    }
});
Ex.HexMapMirror = Ex.HexMap.extend({
    base: null,
    width: function() { return this.get('base.width') || -1; }.property('base.width'),
    height: function() { return this.get('base.width') || -1; }.property('base.height'),

    init: function() {
        var x = [], baseMap= this.get('base.map')
        for(var i = 0; i < baseMap.length; i++) { x.push( Ex.HexCellMirror.create({base: baseMap[i]}) ); }
        this.set('map',[]);
    }
});


Ex.editor = Em.Object.create({data: 'return {task:"assimilate", param: 1};'});

Ex.maps = {}

Ex.updateTile = function(team,state,lastPos, task){
    var player = team.players[team.index],
        width = Ex.maps.global.get('width'),
        height = Ex.maps.global.get('height');

    //Wraparound logic
    if(player.y < 0) { player.y = width - 1; } 
    else if(player.y >= width) { player.y = 0; } 
    else if(player.x < 0) { player.x = width - 1; }
    else if(player.x >= width) { player.x = 0; }

    //For (var map in Ex.maps){
        var futureState = player.id;
        if(futureState == 0 && task == 'move'){
            Ex.maps.global.cellAt(player.x,player.y).set('state',state);
        } else if(futureState == 5){
            player.x = lastPos.x;
            player.y = lastPos.y;
            Ex.maps.global.cellAt(lastPos.x,lastPos.y).set('state',state);
        } else{
            if((futureState == 1 || futureState == 2 || futureState == 3) && task == 'attack'){
                Ex.maps.global.cellAt(player.x,player.y).set('state',1);
            } else if(futureState == 1 && task == 'assimilate'){
                Ex.maps.global.cellAt(player.x,player.y).set('state',state);
                player.push({x:player.x,y:player.y});
            } else if((futureState == 2 || futureState == 3) && futureState != state && task == 'assimilate'){
                state = 1;
            }
            player.x = lastPos.x;
            player.y = lastPos.y;
            Ex.maps.global.cellAt(lastPos.x,lastPos.y).set('state',state);
            if( state == 1){
                team.players.splice(index, 1);
            }
        }
}

Ex.Player = {
    createMine: function(x, y) { return {x: x || 5, y: y || 3, id: 2}; },
    createYours: function(x, y) { return {x: x || 5, y: y || 7, id: 3}; }
};

Ex.AIScript = function() {
    function int(a) { return Math.round(Math.random() * a); }
    var moves = ['attack', 'assimilate', 'move'];
    return {task: moves[int(3)], param: int(5)}; 
};

Ex.executeCommand = function(team) {
    var pos = team.players[team.index],
        pos = {x: pos.x, y: pos.y},

        player = team.players[team.index],
        mod = pos.y % 2;

    Ex.updateTile(team, 0, pos);

    //Move peice
    if(!command || !command.param || !command.task) { return; }
    switch(command.param){
        case 1: //NE
            player.y -= 1;
            player.x += mod;
            break;
        case 2: //E
            player.x += 1;
            break;
        case 3: //SE
            player.y += 1;
            player.x += mod;
            break;
        case 4: //SW
            player.y -= 1;
            player.x += mod - 1;
            break;
        case 5: //W
            team[a].x -= 1;
            break;
        case 6: //NW
            team[a].y -= mod;
            team[a].x -= 1;
            break;
        default:
            command.task = 'move';
            break;
    }
    Ex.updateTile(team, team.id, pos, command.task);    
}