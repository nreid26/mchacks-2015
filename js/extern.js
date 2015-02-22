var Ex = {};
    
Ex.HexCell= Em.Object.extend({
    _colors: ['empty', 'dead', 'mine', 'yours', 'unknown'],
    state: 0,
    class: function() { return this.get('_colors').objectAt(this.get('owner')); }.property('owner')
})

Ex.HexMap = Em.Object.extend({
    map: [],
    width: 10,
    height: 10,

    cellAt: function(x, y) { 
        return this.get('map').objectAt(
            x + this.get('width') * y
        );
    },
    push: function(type) {
        this.get('map').pushObject(
            Ex.HexCell.create({activity: type})
        );
    },
    init: function() {
        this.set('map',[]);
        for(var x = this.get('width'); x >= 1; x--) {
            for(var y = this.get('height'); y >= 1; y--) {
                this.push(0);
            }
        }
    }
});

Ex.editor = Em.Object.create({data: 'default entry'});

Ex.maps = {}