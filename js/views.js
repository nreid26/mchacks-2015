App.EditorView = Em.View.extend({
    didInsertElement: function() {
        this.set('controller.editor', ace.edit('editor'));
    }
});

App.ScoreboxView = Em.View.extend({
    tagName: 'div',
    classNameBindings: ['team.type'],

    team: null,
    map: null,

    adjustHeight: function() {
        Em.run.scheduleOnce('afterRender', this, function() {
            var size = this.get('team.size');
            if(size > 0) {
                this.$().animate({height: (size / this.get('map.tileCount') * 100) + '%'}, 200);
            }
            else { 
                this.$().css({height: 0});
            }
        });
    }.observes('team.size', 'map.tileCount').on('init')
});