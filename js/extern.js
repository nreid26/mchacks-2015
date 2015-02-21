var Ex = {
    editor: null,
    map: Ex.HexMap.create({width:10, height:10}),
    
    HexCell: Em.Object.extend({
        _colors: ['', 'empty', 'mine', 'yours'],
        owner: 0,
        state: function() { return this.get('_colors').objectAt(this.get('activity')); }.property('owner')
    }),

    HexMap: Em.Object.extend({
        map: [],
        width: 0,
        height: 0,

        cellAt: function(x, y) { 
            return this.get('map').objectAt(
                x + this.get('width') * y
            );
        },
        push: function(type) {
            this.get('map').pushObject(
                Ex.HexCell.create({activity: type})
            );
        }
    })
}

for(var x = Ex.map.get('width'); x >= 0; x--) {
    for(var y = Ex.map.get('height'); y >= 0; y--) {
        Ex.map.push(0);
    }
}