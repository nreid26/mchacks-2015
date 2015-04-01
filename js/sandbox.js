var G = {
    messageCodes: Object.freeze({ANIMATE: 1, KILL: 2, RUN: 3, CREATE: 4}),
    taskCodes: Object.freeze({MOVE: 1, ATTACK: 2, ASSIMILATE: 3, LOOK: 4, NULL: 5}),

    taskFunctions: Object.freeze({
        MOVE:       Object.freeze(function(i) { return {task: taskCodes.MOVE, param: i}; }),
        ATTACK:     Object.freeze(function(i) { return {task: taskCodes.ATTACK, param: i}; }),
        ASSIMILATE: Object.freeze(function(i) { return {task: taskCodes.ASSIMILATE, param: i}; }),
        LOOK:       Object.freeze(function(i) { return {task: taskCodes.LOOK, param: i}; }),
    }),

    AI: null,
    team: {tiles: {}, proxy: {}},

    shadows: (function() {
        var s = [];
        for(var k in this) { s.push(k); }
        return s.join();
    })()
};

onmessage = function(event) {
    var msg = event.data;
    
    switch(msg.type) {
        case G.messageCodes.CREATE: {
            G.AI = new Function(
                'team', 'position', //Variables
                'move', 'attack', 'assimilate', 'look', //Functions

                'var ' + G.shadows + ';' + //Shadows
                msg.text //AI
            );
            break;
        }
        case G.messageCodes.ANIMATE: {
            G.team.tiles[msg.id] = {};
            break;
        }
        case G.messageCodes.KILL: {
            var x = G.team.tiles[msg.id];
            for(var key in x) { delete x[key]; }
            delete G.team.tiles[msg.id];
            break;
        }
        case G.messageCodes.RUN: {
            var res = G.AI.call(
                G.team.tiles[msg.id],

                G.team.proxy,
                msg.position,

                G.taskFunctions.MOVE,
                G.taskFunctions.ATTACK,
                G.taskFunctions.ASSIMILATE,
                G.taskFunctions.LOOK
            );

            //Run the LOOK callback
            if(res) {
                if(res.task == G.taskCodes.LOOK && typeof res.param == 'function') {
                    res.param(msg.surroundings);
                    res.param = 0;
                }
            }
            else { res = {task: G.taskCodes.NULL, param: 0}; }

            res.id = msg.id; //Return the affected tile
            postMessage(res);
            break;
        }
    };
};