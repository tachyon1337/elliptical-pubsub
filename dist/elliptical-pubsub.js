
/*
 * =============================================================
 * elliptical.Event
 * =============================================================
 *
 * environment-independent Events/Pubsub implementation. Code culled in part from:
 * https://github.com/federico-lox/pubsub.js
 *
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs

        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.Event=factory();
        root.returnExports = root.elliptical.Event;
    }
}(this, function () {
    var Event={};
    (function (context) {


        /**
         * @private
         */
        function init() {
            //the channel subscription hash
            var channels = {},
            //help minification
                funcType = Function;

            return {
                /*
                 * @public
                 *
                 * Publish/Emit some data on a channel
                 *
                 * @param String channel The channel to publish on
                 * @param Mixed argument The data to publish, the function supports
                 * as many data parameters as needed
                 *
                 * @example Publish stuff on '/some/channel'.
                 * Anything subscribed will be called with a function
                 * signature like: function(a,b,c){ ... }
                 *
                 * Event.emit(
                 *		"/some/channel", "a", "b",
                 *		{total: 10, min: 1, max: 3}
                 * );
                 */
                emit: function () {
                    //help minification
                    var args = arguments,
                    // args[0] is the channel
                        subs = channels[args[0]],
                        len,
                        params,
                        x;

                    if (subs) {
                        len = subs.length;
                        params = (args.length > 1) ?
                            Array.prototype.splice.call(args, 1) : [];

                        //run the callbacks asynchronously,
                        //do not block the main execution process
                        setTimeout(
                            function () {
                                //executes callbacks in the order
                                //in which they were registered
                                for (x = 0; x < len; x += 1) {

                                    subs[x].apply(context, params);
                                }

                                //clear references to allow garbage collection
                                subs = context = params = null;
                            },
                            0
                        );
                    }
                },

                /*
                 * @public
                 *
                 * Register a callback on a channel
                 *
                 * @param String channel The channel to subscribe to
                 * @param Function callback The event handler, any time something is
                 * published on a subscribed channel, the callback will be called
                 * with the published array as ordered arguments
                 *
                 * @return Array A handle which can be used to unsubscribe this
                 * particular subscription
                 *
                 * @example Event.on(
                 *				"/some/channel",
                 *				function(data){ ... }
                 *			);
                 */
                on: function (channel, callback) {
                    if (typeof channel !== 'string') {
                        throw "invalid or missing channel";
                    }

                    if (!(callback instanceof funcType)) {
                        throw "invalid or missing callback";
                    }

                    if (!channels[channel]) {
                        channels[channel] = [];
                    }

                    channels[channel].push(callback);

                    return {channel: channel, callback: callback};
                },

                /*
                 * @public
                 *
                 * Disconnect a subscribed function f.
                 *
                 * @param Mixed handle The return value from a subscribe call or the
                 * name of a channel as a String
                 * @param Function callback [OPTIONAL] The event handler originaally
                 * registered, not needed if handle contains the return value
                 * of subscribe
                 *
                 * @example
                 * var handle = Event.on("/some/channel", function(){});
                 * Event.off(handle);
                 *
                 * or
                 *
                 * Event.off("/some/channel", callback);
                 */
                off: function (handle, callback) {
                    if (handle.channel && handle.callback) {
                        callback = handle.callback;
                        handle = handle.channel;
                    }

                    if (typeof handle !== 'string') {
                        throw "invalid or missing channel";
                    }

                    if (!(callback instanceof funcType)) {
                        throw "invalid or missing callback";
                    }

                    var subs = channels[handle],
                        x,
                        y = (subs instanceof Array) ? subs.length : 0;

                    for (x = 0; x < y; x += 1) {
                        if (subs[x] === callback) {
                            subs.splice(x, 1);
                            break;
                        }
                    }

                },
                /* convenient global unsubscribe/off  */
                flush: function () {
                    channels = {};
                },

                /* list the channels */
                list: function(callback){
                    if(callback){
                        callback(channels);
                    }
                }
            };
        }

        Event.init=init();

    }(this));

    return Event.init; //UMD

}));
/*
 * =============================================================
 * elliptical-pubsub
 * =============================================================
 *
 *
 */

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('ellipsis-element'),require('elliptical-event'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['ellipsis-element','elliptical-event'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory($,root.elliptical.Event);
    }
}(this, function ($,Event) {
    var utils= $.elliptical.utils;
    var _=utils._;

    $.element('elliptical.pubsub',{

       options:{
           channel:null,
           eventBlock:false
       },

        _initElement:function(){
            this._data.subscriptions=[];
            this._subscriptions();
        },

        /**
         * publish data to channel
         * @param channel {String}
         * @param data {Object}
         * @param delay {Number}
         * @param force {Boolean}
         * @private
         */
        _publish: function(channel,data,delay,force){
            //support 2-4 params
            var length=arguments.length;
            if(length===2){
                delay=0;
                force=false;
            }else if(length===3){
                if(typeof delay==='boolean'){
                    force=delay;
                    delay=0;
                }else{
                    force=false;
                }
            }

            if(!this.options.eventBlock || force){
                setTimeout(function(){
                    Event.emit(channel,data);
                },delay);
            }
        },

        /**
         * subscribe to data/message over channel
         * @param channel {String}
         * @param control {String} throttle/debounce
         * @param delay {Number}
         * @param fn {Function}
         * @private
         */
        _subscribe:function(channel,control,delay,fn){
            //support 2-4 params
            var length=arguments.length;
            if(length===2){
                fn=control;
                control=null;
                delay=null;

            }else if(length===3){
                fn=delay;
                delay=350;
            }

            var opts={};
            var func=null;
            if(control==='throttle'){
                func= _.throttle(fn,delay);
            }else if(control==='debounce'){
                opts.leading=true;
                opts.trailing=false;
                func= _.debounce(fn,delay,opts);
            }else{
                func=fn;
            }
            var sub={
                channel:channel,
                fn:func
            };
            if(!(this._data.subscriptions && this._data.subscriptions.length)){
                this._data.subscriptions=[];
            }
            this._data.subscriptions.push(sub);
            Event.on(channel,func);
        },

        _subscriptions: $.noop,

        /**
         * unbind subscriptions
         * @private
         */
        _unbindSubscriptions:function(){

            var subs=this._data.subscriptions;
            subs.forEach(function(obj){
                Event.off(obj.channel,obj.fn);
            });

        },

        _dispose:function(){
            this._unbindSubscriptions();
        }

    });

    return $;

}));