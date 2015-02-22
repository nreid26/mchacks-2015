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

Ex.editor = Em.Object.create({data: 'return {task:"move", param: 2};'});

Ex.maps = {}

Ex.updateTile = function(x,y,state){
    for (var map in Ex.maps){
        if(Ex.maps[map].cellAt(x,y).state != 5){
            console.log('THIS HAPPENED');
            Ex.maps[map].cellAt(x,y).set('state',state);
        }
    }
}

Ex.Player = {
    createMine: function(x, y) { return {x: x || 5, y: y || 4}; },
    createYours: function(x, y) { return {x: x || 5, y: y || 7} }
};

Ex.aiScript = function() {
    return {task: 'move', param: 1};
};

Ex.executeCommand = function(command,a,teamA) {
        var x = teamA[a].x;
        var y = teamA[a].y;
        var team = this.maps.global.cellAt(x,y).state;
        switch(command.task){
            case 'move':
                // move peice
                if(typeof command.param == 'undefined'){
                    //invalid move command, do nothing.
                    console.log('INVALID MOVE');
                } else {
                    Ex.updateTile(x,y,0);
                    switch(command.param){
                        case 1:
                            //move NE
                            if(x % 2){
                                Ex.updateTile(x,y-1,team);
                            } else {
                                Ex.updateTile(x+1,y-1,team);
                            }
                            break;
                        case 2:

                            // move E
                            Ex.updateTile(x+1,y,team);
                            break;
                        case 3:
                            // move SE
                            if(x % 2){
                                Ex.updateTile(x,y+1,team);
                            } else {
                                Ex.updateTile(x+1,y+1,team);
                            }
                            break;
                        case 4:
                            //move SW
                            if(x % 2){
                                Ex.updateTile(x-1,y+1,team);
                            } else {
                                Ex.updateTile(x,y+1,team);
                            }
                            break;
                        case 5:
                            //move W
                            Ex.updateTile(x-1,y,team);
                            break;
                        case 6:
                            //move NW
                            if(x % 2){
                                Ex.updateTile(x-1,y-1,team);
                            } else {
                                Ex.updateTile(x,y-1,team);
                            }
                            break;
                        default:
                            console.log('INVALID MOVE DIRECTION');
                            Ex.updateTile(x,y,team);
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