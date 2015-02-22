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

    clear:function(){
        for(var x = 0; x<this.get('map').length;x++){
            if(this.get('map')[x].state != 5 ){
                this.get('map')[x].set('state',0);
            }
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
    console.log(player[index]);
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
            console.log('shit fucked up');
            console.log('stopped');
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
            console.log('stopped');
            player[index].x = lastPos.x;
            player[index].y = lastPos.y;
            Ex.maps.global.cellAt(lastPos.x,lastPos.y).set('state',state);
            if( state == 1){
                delete player[index];
            }
        }
}

Ex.Player = {
    createMine: function(x, y) { return {x: x || 5, y: y || 3}; },
    createYours: function(x, y) { return {x: x || 5, y: y || 7} }
};

Ex.aiScript = function() {
    return {task: 'move', param: 1};
};

Ex.executeCommand = function(command,a,teamA) {
        lastPos = {x:teamA[a].x,y:teamA[a].y};
        console.log(lastPos);
        var team = this.maps.global.cellAt(lastPos.x,lastPos.y).state;
            // move peice
            if(typeof command.param == 'undefined'){
                //invalid move command, do nothing.
                console.log('INVALID MOVE');
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
                        console.log('INVALID DIRECTION');
                        Ex.updateTile(lastPos,team);
                        break;
                }
            }
        }