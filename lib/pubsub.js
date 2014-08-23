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