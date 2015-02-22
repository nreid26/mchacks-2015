var Ex = {},
    statesToNames = {0: 'empty', 1: 'dead', 2: 'mine', 3: 'yours', 4: 'unknown', 5: 'null'},
    namesToStates = {'empty': 0, 'dead': 1, 'mine': 2, 'yours': 3, 'unknown': 4, 'null': 5};

Ex.HexCell= Em.Object.extend({
    state: 0,
    class: function() { return statesToNames[this.get('state')]; }.property('state')
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


Ex.editor = Em.Object.create({data: 'return {task:"move", param: 1};'});

Ex.maps = {}

Ex.updateTile = function(team, state, lastPos, task) {
    var player = team.players[team.index],
        width = Ex.maps.global.get('width'),
        height = Ex.maps.global.get('height');
        console.log(player);

    //Wraparound logic
    //wraparound logic
    var wraparound = [
    {x:0,y:9,dx:10,dy:3},
    {x:10,y:2,dx:0,dy:7},
    {x:10,y:9,dx:0,dy:3},
    {x:0,y:2,dx:10,dy:8},
    {x:1,y:9,dx:9,dy:2},
    {x:9,y:1,dx:1,dy:8},
    {x:9,y:9,dx:1,dy:2},
    {x:1,y:1,dx:9,dy:8},
    {x:2,y:10,dx:8,dy:2},
    {x:8,y:1,dx:2,dy:9},
    {x:8,y:10,dx:2,dy:2},
    {x:2,y:1,dx:8,dy:9},
    {x:4,y:11,dx:6,dy:1},
    {x:6,y:0,dx:4,dy:10},
    {x:6,y:11,dx:4,dy:1},
    {x:4,y:0,dx:6,dy:10},
    {x:3,y:10,dx:7,dy:1},
    {x:7,y:0,dx:3,dy:9},
    {x:7,y:10,dx:3,dy:1},
    {x:3,y:0,dx:7,dy:9},
    {x:5,y:-1,dx:5,dy:10},
    {x:5,y:11,dx:5,dy:0}];
    if(player.y < 0) { player.y = width - 1; } 
    else if(player.y > width) { player.y = 0; } 
    else if(player.x < 0) { player.x = width - 1; }
    else if(player.x > width) { player.x = 0; }
    else {
        for(var i = 0; i<wraparound.length;i++){
            if(wraparound[i].y == player.x && wraparound[i].x == player.y){
                player.y = wraparound[i].dx;
                player.x = wraparound[i].dy;
                break;
            }
        }
    }

    var futureState = Ex.maps.global.cellAt(player.x,player.y).set('state', state);
    if(task == 'move' && futureState == 0){
        Ex.maps.global.cellAt(player.x,player.y).set('state',state);
    }
    else if(futureState == 5){
        player.x = lastPos.x;
        player.y = lastPos.y;
        Ex.maps.global.cellAt(lastPos.x,lastPos.y).set('state',state);
    } 
    else {
        if((futureState == 1 || futureState == 2 || futureState == 3) && task == 'attack'){
            Ex.maps.global.cellAt(player.x,player.y).set('state',1);
        } 
        else if(futureState == 1 && task == 'assimilate'){
            Ex.maps.global.cellAt(player.x,player.y).set('state',state);
            player.push({x:player.x,y:player.y});
        } 
        else if((futureState == 2 || futureState == 3) && futureState != state && task == 'assimilate'){
            state = 1;
        }
        if(state != 0){
            player.x = lastPos.x;
            player.y = lastPos.y;
        }
        Ex.maps.global.cellAt(lastPos.x,lastPos.y).set('state',state);
        if(state == 1) { team.players.splice(index, 1); }
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

Ex.executeCommand = function(command, team) {
    console.log(command);
    var pos = team.players[team.index],
        pos = {x: pos.x, y: pos.y},

        player = team.players[team.index],
        mod = pos.y % 2,
        state  = Ex.maps.global.cellAt(pos.x,pos.y).get('state');
        Ex.maps.global.cellAt(pos.x,pos.y).set('state',0);
    //Move peice
    if(!command || !command.param || !command.task) { 
        return; }
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
            player.x -= 1;
            break;
        case 6: //NW
            player.y -= mod;
            player.x -= 1;
            break;
        default:
            command.task = 'move';
            break;
    }
    console.log(player.id);
    Ex.maps.global.cellAt(pos.x,pos.y).set('state',0);
    Ex.updateTile(team, state, pos, command.task);    
}