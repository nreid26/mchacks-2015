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

Ex.editor = Em.Object.create({data: 'default entry'});

Ex.maps = {}

Ex.updateTile = function(x,y,state){
    for (var map in Ex.maps){
        if(Ex.maps[map].cellAt(x,y).state != 5){
            Ex.maps[map].cellAt(x,y).set('state',state);
        }
    }
}