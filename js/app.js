App = Ember.Application.create();

App.Router.map(function() {
    this.route('editor');
    this.route('player');

    this.route('all', {path: '*path'});
});


App.EditorRoute = Em.Route.extend({});
App.EditorView = Em.View.extend({
    didInsertElement: function() {
        if(!Ex.editor) {
            var view = this;
            Em.run.schedule('afterRender', function() {
                Ex.editor = ace.edit("editor"); 
                Ex.editor.setTheme("ace/theme/monokai");
                Ex.editor.getSession().setMode("ace/mode/javascript");
            });
        }
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
