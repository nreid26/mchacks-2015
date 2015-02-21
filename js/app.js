App = Ember.Application.create();

App.Router.map(function() {
    this.route('editor');
    this.route('player');

    this.route('all', {path: '*path'});
});


App.EditorRoute = Em.Route.extend({});
App.EditorView = Em.View.extend({
    didInsertElement: function() {
        var view = this;
        Em.run.schedule('afterRender', function() {
            var v = ace.edit("editor"); 
            v.setTheme("ace/theme/monokai");
            v.getSession().setMode("ace/mode/javascript");
            v.setValue(Ex.editor.get('data'));
            v.on('change', function() {
                Ex.editor.set('data',v.getValue());
            });
        });
    }
});
App.EditorController = Em.Controller.extend({
    actions: {
        presentEditor: function() {
            var code = Ex.editor.getValue();
            alert(code);
        }
    }
});


App.AllRoute = Em.Route.extend({
    redirect: function() {
        this.transitionTo('editor');
    }
});
App.IndexRoute = App.AllRoute;
