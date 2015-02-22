var Ex = {};
    
Ex.HexCell= Em.Object.extend({
    _colors: ['empty', 'dead', 'mine', 'yours', 'unknown'],
    state: 0,
    class: function() { return this.get('_colors').objectAt(this.get('state')); }.property('state')
})

Ex.HexMap = Em.Object.extend({
    map: [],
    width: 10,
    height: 10,
    defaultState: 0,

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
        for(var x = this.get('width'); x > 0; x--) {
            for(var y = this.get('height'); y > 0; y--) {
                this.push(this.get('defaultState'));
            }
        }
    }
});

Ex.editor = Em.Object.create({data: 'default entry'});

Ex.maps = {}