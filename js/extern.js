var Ex = {};
    
Ex.HexCell= Em.Object.extend({
    _colors: ['empty', 'dead', 'mine', 'yours', 'unknown', 'null'],
    state: 0,
    class: function() { return this.get('_colors').objectAt(this.get('state')); }.property('state')
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

Ex.updateTile = function(player,index,state,lastPos, task){
    //wraparound logic
    if(player[index].y<0){
        player[index].y = Ex.maps.global.get('width') -1;
    } else if ( player[index].y >= Ex.maps.global.get('width')){
        player[index].y = 0;
    } else if(player[index].x<0){
        player[index].x = Ex.maps.global.get('height') -1;
    } else if ( player[index].x >= Ex.maps.global.get('height')){
        player[index].x = 0;
    }


    //for (var map in Ex.maps){
        var futureState = Ex.maps.global.cellAt(player[index].x,player[index].y).state;
        if(futureState == 0 && task == 'move'){
            Ex.maps.global.cellAt(player[index].x,player[index].y).set('state',state);
        } else if(futureState == 5){
            player[index].x = lastPos.x;
            player[index].y = lastPos.y;
            Ex.maps.global.cellAt(lastPos.x,lastPos.y).set('state',state);
        } else{
            if((futureState == 1 || futureState == 2 || futureState == 3) && task == 'attack'){
                Ex.maps.global.cellAt(player[index].x,player[index].y).set('state',1);
            } else if(futureState == 1 && task == 'assimilate'){
                Ex.maps.global.cellAt(player[index].x,player[index].y).set('state',state);
                player.push({x:player[index].x,y:player[index].y});
            } else if((futureState == 2 || futureState == 3) && futureState != state && task == 'assimilate'){
                state = 1;
            }
            player[index].x = lastPos.x;
            player[index].y = lastPos.y;
            Ex.maps.global.cellAt(lastPos.x,lastPos.y).set('state',state);
            if( state == 1){
                player.splice(index,1);
            }
        }
}

Ex.Player = {
    createMine: function(x, y) { return {x: x || 5, y: y || 3}; },
    createYours: function(x, y) { return {x: x || 5, y: y || 7} }
};

Ex.aiScript = function() {
    function int(a) { return Math.round(Math.random() * a); }
    var moves = ['attack', 'assimilate', 'move'];
    return {task: moves[int(3)], param: int(5)}; 
};

Ex.executeCommand = function(command,a,teamA) {
        lastPos = {x:teamA[a].x,y:teamA[a].y};
        var team = this.maps.global.cellAt(lastPos.x,lastPos.y).state;
            // move peice
            if(typeof command.param == 'undefined'){
                //invalid move command, do nothing.
            } else {
                Ex.updateTile(teamA,a,0,lastPos);
                switch(command.param){
                    case 1:
                        //move NE
                        if(lastPos.y % 2){
                            teamA[a].y -= 1;
                            teamA[a].x += 1;
                            Ex.updateTile(teamA,a,team,lastPos,command.task);
                        } else {
                            teamA[a].y -= 1;
                            Ex.updateTile(teamA,a,team,lastPos,command.task);    
                        }
                        break;
                    case 2:

                        // move E
                        teamA[a].x += 1;
                        Ex.updateTile(teamA,a,team,lastPos,command.task);
                        break;
                    case 3:
                        // move SE
                        if(lastPos.y % 2){
                            teamA[a].y += 1;
                            teamA[a].x += 1;
                            Ex.updateTile(teamA,a,team,lastPos,command.task);
                        } else {
                            teamA[a].y += 1;
                            Ex.updateTile(teamA,a,team,lastPos,command.task);
                        }
                        break;
                    case 4:
                        //move SW
                        if(lastPos.y % 2){
                            teamA[a].y += 1;
                            Ex.updateTile(teamA,a,team,lastPos,command.task);
                        } else {
                            teamA[a].y += 1;
                            teamA[a].x -= 1;
                            Ex.updateTile(teamA,a,team,lastPos,command.task);
                        }
                        break;
                    case 5:
                        //move W
                        teamA[a].x -= 1;
                        Ex.updateTile(teamA,a,team,lastPos,command.task);
                        break;
                    case 6:
                        //move NW
                        if(lastPos.y % 2){
                            teamA[a].y -= 1;
                            Ex.updateTile(teamA,a,team,lastPos,command.task);
                            
                        } else {
                            teamA[a].y -= 1;
                            teamA[a].x -= 1;
                            Ex.updateTile(teamA,a,team,lastPos,command.task);    
                        }
                        break;
                    default:
                        Ex.updateTile(teamA,a,team,lastPos,'move');
                        break;
                }
            }
        }
Ex.lookAbout = function(players){
    var spots = [];
    for(var current in players){
        spots.push((players[current].x + 0) + 11 * (players[current].y + 0));
        spots.push((players[current].x + 1) + 11 * (players[current].y + 0));
        spots.push((players[current].x - 1) + 11 * (players[current].y + 0));
        //get every spot
        if(lastPos.y % 2){
            spots.push((players[current].x +1) + 11 * (players[current].y -1));
            spots.push((players[current].x +1) + 11 * (players[current].y +1));
            spots.push((players[current].x) + 11 * (players[current].y +1));
            spots.push((players[current].x) + 11 * (players[current].y -1));
        } else {
            spots.push((players[current].x) + 11 * (players[current].y -1));
            spots.push((players[current].x) + 11 * (players[current].y +1));
            spots.push((players[current].x-1 ) + 11 * (players[current].y +1));
            spots.push((players[current].x-1 ) + 11 * (players[current].y -1));
        }
    }
    spots.sort();
    jQuery.unique(spots);
    var mappings;
    for(var current in spots){
        mappings.push({x:spots[current]%11,y:Math.floor(spots[current]/11)});   
    }
    console.log(mappings);
    return mappings;
}