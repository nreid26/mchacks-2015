var Ex = {};
    
Ex.HexCell= Em.Object.extend({
    _colors: ['empty', 'dead', 'mine', 'yours', 'unknown','null'],
    state: 0,
    class: function() { return this.get('_colors').objectAt(this.get('state')); }.property('state')
})

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
    push: function(type) {
        this.get('map').pushObject(
            Ex.HexCell.create({state: type})
        );
    },
    init: function() {
        this.set('map',[]);
        var removal = [3,2,2,1,1,0,1,1,2,2,3];
        for(var x = 0; x<this.get('height');x++) {
            for(var y = 0; y<this.get('width');y++) {  
                if(removal[x] > y || (x < 6 && x+5+removal[x] < y) || (x >= 6 && 15-x+removal[x] < y)){
                    this.push(5);
                } else {
                   this.push(this.get('defaultState'));
               }
            }
        }
    }
});

Ex.editor = Em.Object.create({data: 'return {task:"move", param: 1};'});

Ex.maps = {}

Ex.updateTile = function(player,state,lastPos){
    console.log(player);
    if(player.y<0){
        player.y = Ex.maps.global.get('width') -1;
    } else if ( player.y >= Ex.maps.global.get('width')){
        player.y = 0;
    } else if(player.x<0){
        player.x = Ex.maps.global.get('height') -1;
    } else if ( player.x >= Ex.maps.global.get('height')){
        player.x = 0;
    }

    //for (var map in Ex.maps){
        var futureState = Ex.maps.global.cellAt(player.x,player.y).state;
        if(futureState == 0){
            Ex.maps.global.cellAt(player.x,player.y).set('state',state);
        } else if(futureState == 5){
            console.log('shit fucked up');
            console.log('stopped');
            player.x = lastPos.x;
            player.y = lastPos.y;
            Ex.maps.global.cellAt(lastPos.x,lastPos.y).set('state',state);
        } else{
            console.log('stopped');
            player.x = lastPos.x;
            player.y = lastPos.y;
            Ex.maps.global.cellAt(lastPos.x,lastPos.y).set('state',state);
        }
    //}
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
        switch(command.task){
            case 'move':
                // move peice
                if(typeof command.param == 'undefined'){
                    //invalid move command, do nothing.
                    console.log('INVALID MOVE');
                } else {
                    Ex.updateTile(teamA[a],0,lastPos);
                    switch(command.param){
                        case 1:
                            //move NE
                            if(lastPos.y % 2){
                                teamA[a].y -= 1;
                                teamA[a].x += 1;
                                Ex.updateTile(teamA[a],team,lastPos);
                            } else {
                                teamA[a].y -= 1;
                                Ex.updateTile(teamA[a],team,lastPos);    
                            }
                            break;
                        case 2:

                            // move E
                            teamA[a].x += 1;
                            Ex.updateTile(teamA[a],team,lastPos);
                            break;
                        case 3:
                            // move SE
                            if(lastPos.y % 2){
                                teamA[a].y += 1;
                                teamA[a].x += 1;
                                Ex.updateTile(teamA[a],team,lastPos);
                            } else {
                                teamA[a].y += 1;
                                Ex.updateTile(teamA[a],team,lastPos);
                            }
                            break;
                        case 4:
                            //move SW
                            if(lastPos.y % 2){
                                teamA[a].y += 1;
                                Ex.updateTile(teamA[a],team,lastPos);
                            } else {
                                teamA[a].y += 1;
                                teamA[a].x -= 1;
                                Ex.updateTile(teamA[a],team,lastPos);
                            }
                            break;
                        case 5:
                            //move W
                            teamA[a].x -= 1;
                            Ex.updateTile(teamA[a],team,lastPos);
                            break;
                        case 6:
                            //move NW
                            if(lastPos.y % 2){
                                teamA[a].y -= 1;
                                Ex.updateTile(teamA[a],team,lastPos);
                                
                            } else {
                                teamA[a].y -= 1;
                                teamA[a].x -= 1;
                                Ex.updateTile(teamA[a],team,lastPos);    
                            }
                            break;
                        default:
                            console.log('INVALID MOVE DIRECTION');
                            Ex.updateTile(lastPos,team);
                            break;
                    }
                }
                break;
            case 'assimilate':
                if(typeof command.param == 'undefined'){
                    //invalid move command, do nothing.
                    console.log('INVALID MOVE');
                } else {
                    switch(command.param){
                        case 1:
                            //assimulate tile that is N
                            break;
                        case 2:
                            // assimulate tile that is NE
                            break;
                        case 3:
                            // assimulate tile that is SE
                            break;
                        case 4:
                            //assimulate tile that is S
                            break;
                        case 5:
                            //assimulate tile that is SW
                            break;
                        case 6:
                            //assimulate tile that is NW
                            break;
                        default:
                            console.log('INVALID MOVE DIRECTION');
                            break;
                    }
                }
                break;
            case 'attack':
                if(typeof command.param == 'undefined'){
                    //invalid move command, do nothing.
                    console.log('INVALID MOVE');
                } else {
                    switch(command.param){
                        case 1:
                            //move forward (N)
                            break;
                        case 2:
                            // move NE
                            break;
                        case 3:
                            // move SE
                            break;
                        case 4:
                            //move S
                            break;
                        case 5:
                            //move SW
                            break;
                        case 6:
                            //move NW
                            break;
                        default:
                            console.log('INVALID MOVE DIRECTION');
                            break;
                    }
                }
                break;
            case 'search':
                if(typeof command.param == 'undefined'){
                    //add 3 to "look" area.
                } else {
                    //invalid search command, do nothing.
                    console.log('INVALID search');
                }
                break;
            default:
                console.log('INVALID COMMAND')
        }
    }