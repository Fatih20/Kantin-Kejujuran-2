
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const initialStoreBalance = 100000;
    const maxNameLength = 40;
    const maxDescriptionLength = 100;
    const initialSortCondition = [true, true];
    const validImageExtensionList = ["png", "jpg", "gif", "jpeg"];
    const successTextDuration = 500;

    function priceDenominator(rawPrice) {
        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2
        });
        return formatter.format(rawPrice);
    }
    function fetchItemFromLocalStorage(key) {
        let candidateResult = localStorage.getItem(key);
        if (candidateResult !== undefined && candidateResult !== null) {
            return JSON.parse(candidateResult);
        }
        else {
            return undefined;
        }
    }
    function compareFunctionGenerator(isDate, isAscending) {
        // const keyOfComparedValue = (isDate ? "milisecondsCreated" : "name") as keyof ISoldItem
        const compareFunction = (isDate ?
            (soldItem1, soldItem2) => {
                return soldItem1["milisecondCreated"] < soldItem2["milisecondCreated"] ? -1 : (soldItem1["milisecondCreated"] > soldItem2["milisecondCreated"] ? 1 : 0);
            } : (soldItem1, soldItem2) => {
            return soldItem1["name"] < soldItem2["name"] ? -1 : (soldItem1["name"] > soldItem2["name"] ? 1 : 0);
        });
        const alternateCompareFunction = (soldItem1, soldItem2) => {
            return -1 * compareFunction(soldItem1, soldItem2);
        };
        return isAscending ? compareFunction : alternateCompareFunction;
    }
    function validImageChecker(imageName) {
        for (const validImageExtension of validImageExtensionList) {
            const testedRegex = new RegExp(`\\.${validImageExtension}+$`);
            if (testedRegex.test(imageName)) {
                return true;
            }
        }
        return false;
    }

    function createStoreBalance() {
        const { subscribe, set, update } = writable(initializeStoreBalance());
        function initializeStoreBalance() {
            var _a;
            const newInitialStoreBalance = ((_a = fetchItemFromLocalStorage("storeBalance")) !== null && _a !== void 0 ? _a : initialStoreBalance);
            localStorage.setItem("storeBalance", JSON.stringify(newInitialStoreBalance));
            return newInitialStoreBalance;
        }
        function add(increment) {
            update(previousBalance => {
                const newValue = previousBalance + increment;
                localStorage.setItem("storeBalance", JSON.stringify(newValue));
                return newValue;
            });
        }
        function subtract(increment) {
            update(previousBalance => {
                const newValue = previousBalance - increment;
                localStorage.setItem("storeBalance", JSON.stringify(newValue));
                return newValue;
            });
        }
        async function reset() {
            localStorage.removeItem("storeBalance");
            set(initialStoreBalance);
        }
        function removeFromLocalStorage() {
            localStorage.removeItem("storeBalance");
        }
        return {
            subscribe,
            reset,
            set,
            update,
            add,
            subtract,
            removeFromLocalStorage,
        };
    }
    function createSoldItemList() {
        const { subscribe, set, update } = writable(initializeSoldItemList());
        function initializeSoldItemList() {
            var _a;
            const newInitialSoldItemList = ((_a = fetchItemFromLocalStorage("soldItemList")) !== null && _a !== void 0 ? _a : []);
            localStorage.setItem("soldItemList", JSON.stringify(newInitialSoldItemList));
            return newInitialSoldItemList;
        }
        function insert(newSoldItem) {
            update(previousSoldItemList => {
                const date = new Date();
                const dateCreated = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
                const timeAppendedNewSoldItem = Object.assign(Object.assign({}, newSoldItem), { dateCreated, milisecondCreated: date.getTime() });
                const newSoldItemList = [...previousSoldItemList, timeAppendedNewSoldItem];
                localStorage.setItem("soldItemList", JSON.stringify(newSoldItemList));
                return newSoldItemList;
            });
        }
        function remove(removedSoldItem) {
            update(previousSoldItemList => {
                console.log("Is trying to remove");
                const newSoldItemList = previousSoldItemList.filter((soldItem) => JSON.stringify(soldItem) !== JSON.stringify(removedSoldItem));
                localStorage.setItem("soldItemList", JSON.stringify(newSoldItemList));
                return newSoldItemList;
            });
        }
        function resort(sortCondition) {
            update(previousSoldItemList => {
                console.log(previousSoldItemList);
                previousSoldItemList.sort(compareFunctionGenerator(sortCondition[0], sortCondition[1]));
                console.log(previousSoldItemList);
                localStorage.setItem("soldItemList", JSON.stringify(previousSoldItemList));
                return previousSoldItemList;
            });
        }
        async function reset() {
            localStorage.removeItem("soldItemList");
            set([]);
        }
        function removeFromLocalStorage() {
            localStorage.removeItem("soldItemList");
        }
        return {
            subscribe,
            reset,
            set,
            update,
            insert,
            remove,
            resort,
            removeFromLocalStorage,
        };
    }
    function createSortCondition() {
        const { subscribe, set, update } = writable(initializeSortCondition());
        function initializeSortCondition() {
            var _a;
            const newSortCondition = ((_a = fetchItemFromLocalStorage("sortCondition")) !== null && _a !== void 0 ? _a : initialSortCondition);
            localStorage.setItem("sortCondition", JSON.stringify(newSortCondition));
            return newSortCondition;
        }
        function alternateSortBy() {
            update(previousSortCondition => {
                previousSortCondition[0] = !previousSortCondition[0];
                localStorage.setItem("sortCondition", JSON.stringify(previousSortCondition));
                return previousSortCondition;
            });
        }
        function alternateSortOrder() {
            update(previousSortCondition => {
                previousSortCondition[1] = !previousSortCondition[1];
                localStorage.setItem("sortCondition", JSON.stringify(previousSortCondition));
                return previousSortCondition;
            });
        }
        return {
            subscribe,
            set,
            update,
            alternateSortBy,
            alternateSortOrder
        };
    }
    const appState = writable("add");
    const soldItemList = createSoldItemList();
    const storeBalance = createStoreBalance();
    const sortCondition = createSortCondition();

    /* src/components/StartPage.svelte generated by Svelte v3.48.0 */
    const file$7 = "src/components/StartPage.svelte";

    function create_fragment$7(ctx) {
    	let head;
    	let link0;
    	let t0;
    	let link1;
    	let t1;
    	let link2;
    	let t2;
    	let main;
    	let div1;
    	let h1;
    	let t3;
    	let br;
    	let t4;
    	let t5;
    	let div0;
    	let button;
    	let h3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			head = element("head");
    			link0 = element("link");
    			t0 = space();
    			link1 = element("link");
    			t1 = space();
    			link2 = element("link");
    			t2 = space();
    			main = element("main");
    			div1 = element("div");
    			h1 = element("h1");
    			t3 = text("Honest");
    			br = element("br");
    			t4 = text("Canteen");
    			t5 = space();
    			div0 = element("div");
    			button = element("button");
    			h3 = element("h3");
    			h3.textContent = "Start Trading";
    			attr_dev(link0, "rel", "preconnect");
    			attr_dev(link0, "href", "https://fonts.googleapis.com");
    			add_location(link0, file$7, 7, 2, 146);
    			attr_dev(link1, "rel", "preconnect");
    			attr_dev(link1, "href", "https://fonts.gstatic.com");
    			add_location(link1, file$7, 8, 2, 210);
    			attr_dev(link2, "href", "https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap");
    			attr_dev(link2, "rel", "stylesheet");
    			add_location(link2, file$7, 9, 2, 271);
    			add_location(head, file$7, 6, 0, 137);
    			attr_dev(br, "class", "svelte-1nmbytx");
    			add_location(br, file$7, 17, 25, 463);
    			attr_dev(h1, "id", "title");
    			attr_dev(h1, "class", "svelte-1nmbytx");
    			add_location(h1, file$7, 17, 4, 442);
    			attr_dev(h3, "class", "start-button-title svelte-1nmbytx");
    			add_location(h3, file$7, 26, 8, 689);
    			attr_dev(button, "class", "option-container svelte-1nmbytx");
    			add_location(button, file$7, 20, 6, 556);
    			attr_dev(div0, "id", "button-container");
    			attr_dev(div0, "class", "svelte-1nmbytx");
    			add_location(div0, file$7, 19, 4, 522);
    			attr_dev(div1, "id", "content-container");
    			attr_dev(div1, "class", "svelte-1nmbytx");
    			add_location(div1, file$7, 16, 2, 409);
    			attr_dev(main, "class", "svelte-1nmbytx");
    			add_location(main, file$7, 15, 0, 400);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, head, anchor);
    			append_dev(head, link0);
    			append_dev(head, t0);
    			append_dev(head, link1);
    			append_dev(head, t1);
    			append_dev(head, link2);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, h1);
    			append_dev(h1, t3);
    			append_dev(h1, br);
    			append_dev(h1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(button, h3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(head);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(main);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StartPage', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StartPage> was created with unknown prop '${key}'`);
    	});

    	const click_handler = async () => {
    		appState.set("trade");
    	};

    	$$self.$capture_state = () => ({ appState });
    	return [click_handler];
    }

    class StartPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartPage",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/Header.svelte generated by Svelte v3.48.0 */
    const file$6 = "src/components/Header.svelte";

    function create_fragment$6(ctx) {
    	let head;
    	let link0;
    	let t0;
    	let link1;
    	let t1;
    	let link2;
    	let t2;
    	let script;
    	let script_src_value;
    	let t3;
    	let link3;
    	let t4;
    	let main;
    	let button0;
    	let t5;
    	let h1;
    	let t7;
    	let button1;
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			head = element("head");
    			link0 = element("link");
    			t0 = space();
    			link1 = element("link");
    			t1 = space();
    			link2 = element("link");
    			t2 = space();
    			script = element("script");
    			t3 = space();
    			link3 = element("link");
    			t4 = space();
    			main = element("main");
    			button0 = element("button");
    			t5 = space();
    			h1 = element("h1");
    			h1.textContent = "HC";
    			t7 = space();
    			button1 = element("button");
    			i = element("i");
    			attr_dev(link0, "rel", "preconnect");
    			attr_dev(link0, "href", "https://fonts.googleapis.com");
    			add_location(link0, file$6, 4, 2, 76);
    			attr_dev(link1, "rel", "preconnect");
    			attr_dev(link1, "href", "https://fonts.gstatic.com");
    			add_location(link1, file$6, 5, 2, 140);
    			attr_dev(link2, "href", "https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap");
    			attr_dev(link2, "rel", "stylesheet");
    			add_location(link2, file$6, 6, 2, 201);
    			if (!src_url_equal(script.src, script_src_value = "https://kit.fontawesome.com/31a5898fa1.js")) attr_dev(script, "src", script_src_value);
    			attr_dev(script, "crossorigin", "anonymous");
    			add_location(script, file$6, 10, 2, 323);
    			attr_dev(link3, "rel", "stylesheet");
    			attr_dev(link3, "href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta2/css/all.min.css");
    			attr_dev(link3, "integrity", "sha512-YWzhKL2whUzgiheMoBFwW8CKV4qpHQAEuvilg9FAn5VJUDwKZZxkJNuGM4XkWuk94WCrrwslk8yWNGmY1EduTA==");
    			attr_dev(link3, "crossorigin", "anonymous");
    			attr_dev(link3, "referrerpolicy", "no-referrer");
    			add_location(link3, file$6, 13, 2, 423);
    			add_location(head, file$6, 3, 0, 67);
    			attr_dev(button0, "class", "header-button add-button svelte-8a654f");
    			toggle_class(button0, "header-button-disabled", /*$appState*/ ctx[0] === "add");
    			add_location(button0, file$6, 23, 2, 779);
    			attr_dev(h1, "class", "title svelte-8a654f");
    			add_location(h1, file$6, 29, 2, 941);
    			attr_dev(i, "class", "fa-solid fa-plus");
    			add_location(i, file$6, 35, 4, 1161);
    			attr_dev(button1, "class", "header-button add-button svelte-8a654f");
    			toggle_class(button1, "header-button-disabled", /*$appState*/ ctx[0] === "add");
    			add_location(button1, file$6, 30, 2, 1012);
    			attr_dev(main, "class", "svelte-8a654f");
    			toggle_class(main, "header-in-add", /*$appState*/ ctx[0] === "add");
    			add_location(main, file$6, 22, 0, 728);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, head, anchor);
    			append_dev(head, link0);
    			append_dev(head, t0);
    			append_dev(head, link1);
    			append_dev(head, t1);
    			append_dev(head, link2);
    			append_dev(head, t2);
    			append_dev(head, script);
    			append_dev(head, t3);
    			append_dev(head, link3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, button0);
    			append_dev(main, t5);
    			append_dev(main, h1);
    			append_dev(main, t7);
    			append_dev(main, button1);
    			append_dev(button1, i);

    			if (!mounted) {
    				dispose = [
    					listen_dev(h1, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$appState*/ 1) {
    				toggle_class(button0, "header-button-disabled", /*$appState*/ ctx[0] === "add");
    			}

    			if (dirty & /*$appState*/ 1) {
    				toggle_class(button1, "header-button-disabled", /*$appState*/ ctx[0] === "add");
    			}

    			if (dirty & /*$appState*/ 1) {
    				toggle_class(main, "header-in-add", /*$appState*/ ctx[0] === "add");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(head);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $appState;
    	validate_store(appState, 'appState');
    	component_subscribe($$self, appState, $$value => $$invalidate(0, $appState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => appState.set("startPage");
    	const click_handler_1 = () => appState.set("add");
    	$$self.$capture_state = () => ({ appState, $appState });
    	return [$appState, click_handler, click_handler_1];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/SoldItem.svelte generated by Svelte v3.48.0 */
    const file$5 = "src/components/SoldItem.svelte";

    function create_fragment$5(ctx) {
    	let main;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let p;
    	let t2;
    	let h4;
    	let t4;
    	let div2;
    	let t5;
    	let div3;
    	let button0;
    	let t7;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			p = element("p");
    			p.textContent = `${/*name*/ ctx[1]}`;
    			t2 = space();
    			h4 = element("h4");
    			h4.textContent = `${priceDenominator(/*price*/ ctx[2])}`;
    			t4 = space();
    			div2 = element("div");
    			t5 = space();
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "See Item";
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "Buy Item";

    			if (!src_url_equal(img.src, img_src_value = Math.random() >= 0.5
    			? "placeholder3.png"
    			: "placeholder2.png")) attr_dev(img, "src", img_src_value);

    			attr_dev(img, "alt", "product");
    			attr_dev(img, "class", "image svelte-1jwxm3o");
    			add_location(img, file$5, 15, 4, 399);
    			attr_dev(div0, "class", "image-container svelte-1jwxm3o");
    			add_location(div0, file$5, 14, 2, 365);
    			attr_dev(p, "class", "title svelte-1jwxm3o");
    			add_location(p, file$5, 22, 4, 570);
    			add_location(h4, file$5, 23, 4, 602);
    			attr_dev(div1, "class", "text-container svelte-1jwxm3o");
    			add_location(div1, file$5, 21, 2, 537);
    			attr_dev(div2, "class", "spacer svelte-1jwxm3o");
    			add_location(div2, file$5, 26, 2, 682);
    			attr_dev(button0, "class", "svelte-1jwxm3o");
    			add_location(button0, file$5, 28, 4, 742);
    			attr_dev(button1, "class", "svelte-1jwxm3o");
    			add_location(button1, file$5, 29, 4, 807);
    			attr_dev(div3, "class", "button-container svelte-1jwxm3o");
    			add_location(div3, file$5, 27, 2, 707);
    			attr_dev(main, "class", "svelte-1jwxm3o");
    			add_location(main, file$5, 13, 0, 356);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, img);
    			append_dev(main, t0);
    			append_dev(main, div1);
    			append_dev(div1, p);
    			append_dev(div1, t2);
    			append_dev(div1, h4);
    			append_dev(main, t4);
    			append_dev(main, div2);
    			append_dev(main, t5);
    			append_dev(main, div3);
    			append_dev(div3, button0);
    			append_dev(div3, t7);
    			append_dev(div3, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SoldItem', slots, []);
    	let { soldItem } = $$props;
    	const { name, price } = soldItem;
    	const dispatch = createEventDispatcher();

    	function handleSeeItem() {
    		dispatch("seeItem", { soldItem });
    	}

    	const writable_props = ['soldItem'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SoldItem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handleSeeItem();
    	const click_handler_1 = () => soldItemList.remove(soldItem);

    	$$self.$$set = $$props => {
    		if ('soldItem' in $$props) $$invalidate(0, soldItem = $$props.soldItem);
    	};

    	$$self.$capture_state = () => ({
    		soldItemList,
    		priceDenominator,
    		createEventDispatcher,
    		soldItem,
    		name,
    		price,
    		dispatch,
    		handleSeeItem
    	});

    	$$self.$inject_state = $$props => {
    		if ('soldItem' in $$props) $$invalidate(0, soldItem = $$props.soldItem);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [soldItem, name, price, handleSeeItem, click_handler, click_handler_1];
    }

    class SoldItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { soldItem: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SoldItem",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*soldItem*/ ctx[0] === undefined && !('soldItem' in props)) {
    			console.warn("<SoldItem> was created without expected prop 'soldItem'");
    		}
    	}

    	get soldItem() {
    		throw new Error("<SoldItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set soldItem(value) {
    		throw new Error("<SoldItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Shelf.svelte generated by Svelte v3.48.0 */
    const file$4 = "src/components/Shelf.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (50:2) {#if shelfState === "one"}
    function create_if_block_1$3(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let div1;
    	let h3;
    	let t1;
    	let t2;
    	let p0;
    	let t3;
    	let t4;
    	let h2;
    	let t5_value = priceDenominator(/*seenPrice*/ ctx[6]) + "";
    	let t5;
    	let t6;
    	let p1;
    	let t7;
    	let t8;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			t1 = text(/*seenName*/ ctx[7]);
    			t2 = space();
    			p0 = element("p");
    			t3 = text(/*seenDate*/ ctx[4]);
    			t4 = space();
    			h2 = element("h2");
    			t5 = text(t5_value);
    			t6 = space();
    			p1 = element("p");
    			t7 = text(/*seenDescription*/ ctx[5]);
    			t8 = space();
    			button = element("button");
    			button.textContent = "Buy Item";
    			attr_dev(img, "class", "seen-image svelte-18ar49j");
    			if (!src_url_equal(img.src, img_src_value = "placeholder3.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Product chosen");
    			add_location(img, file$4, 54, 10, 1880);
    			attr_dev(div0, "class", "seen-image-container svelte-18ar49j");
    			add_location(div0, file$4, 53, 8, 1835);
    			attr_dev(h3, "class", "seen-name svelte-18ar49j");
    			add_location(h3, file$4, 58, 12, 2070);
    			attr_dev(p0, "class", "seen-date svelte-18ar49j");
    			add_location(p0, file$4, 59, 12, 2120);
    			attr_dev(div1, "class", "title-part-container");
    			add_location(div1, file$4, 57, 10, 2023);
    			attr_dev(h2, "class", "seen-price svelte-18ar49j");
    			add_location(h2, file$4, 61, 10, 2183);
    			attr_dev(p1, "class", "seen-description");
    			add_location(p1, file$4, 62, 10, 2251);
    			attr_dev(div2, "class", "main-seen-item-container svelte-18ar49j");
    			add_location(div2, file$4, 56, 8, 1974);
    			attr_dev(button, "class", "buy-in-see-button svelte-18ar49j");
    			add_location(button, file$4, 64, 8, 2324);
    			attr_dev(div3, "class", "seen-item-container svelte-18ar49j");
    			add_location(div3, file$4, 52, 6, 1755);
    			attr_dev(div4, "class", "absolute-container svelte-18ar49j");
    			add_location(div4, file$4, 50, 4, 1648);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, img);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p0);
    			append_dev(p0, t3);
    			append_dev(div2, t4);
    			append_dev(div2, h2);
    			append_dev(h2, t5);
    			append_dev(div2, t6);
    			append_dev(div2, p1);
    			append_dev(p1, t7);
    			append_dev(div3, t8);
    			append_dev(div3, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*handleBuySeenItem*/ ctx[10], false, false, false),
    					listen_dev(div3, "click", click_handler, false, false, false),
    					listen_dev(div4, "click", /*handleCloseSeeItem*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*seenName*/ 128) set_data_dev(t1, /*seenName*/ ctx[7]);
    			if (dirty & /*seenDate*/ 16) set_data_dev(t3, /*seenDate*/ ctx[4]);
    			if (dirty & /*seenPrice*/ 64 && t5_value !== (t5_value = priceDenominator(/*seenPrice*/ ctx[6]) + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*seenDescription*/ 32) set_data_dev(t7, /*seenDescription*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(50:2) {#if shelfState === \\\"one\\\"}",
    		ctx
    	});

    	return block;
    }

    // (82:2) {:else}
    function create_else_block$1(ctx) {
    	let div2;
    	let p;
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let div0;
    	let t3;
    	let div1;
    	let button0;
    	let t4;
    	let t5;
    	let button1;
    	let t6;
    	let t7;
    	let div3;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*$soldItemList*/ ctx[8];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*soldItem*/ ctx[17].milisecondCreated;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			p = element("p");
    			t0 = text("Sort Method: ");
    			span = element("span");
    			t1 = text(/*overallSortingText*/ ctx[1]);
    			t2 = space();
    			div0 = element("div");
    			t3 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t4 = text(/*secondSortingText*/ ctx[2]);
    			t5 = space();
    			button1 = element("button");
    			t6 = text(/*firstSortingText*/ ctx[3]);
    			t7 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span, "class", "svelte-18ar49j");
    			add_location(span, file$4, 83, 40, 2872);
    			attr_dev(p, "class", "sort-text svelte-18ar49j");
    			add_location(p, file$4, 83, 6, 2838);
    			attr_dev(div0, "class", "spacer svelte-18ar49j");
    			add_location(div0, file$4, 84, 6, 2916);
    			attr_dev(button0, "class", "sort-button svelte-18ar49j");
    			add_location(button0, file$4, 86, 8, 2989);
    			attr_dev(button1, "class", "sort-button svelte-18ar49j");
    			add_location(button1, file$4, 89, 8, 3115);
    			attr_dev(div1, "class", "sort-button-container svelte-18ar49j");
    			add_location(div1, file$4, 85, 6, 2945);
    			attr_dev(div2, "class", "sort-container svelte-18ar49j");
    			add_location(div2, file$4, 82, 4, 2803);
    			attr_dev(div3, "class", "shelf svelte-18ar49j");
    			add_location(div3, file$4, 94, 4, 3261);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, p);
    			append_dev(p, t0);
    			append_dev(p, span);
    			append_dev(span, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div0);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(button0, t4);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			append_dev(button1, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div3, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[15], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*overallSortingText*/ 2) set_data_dev(t1, /*overallSortingText*/ ctx[1]);
    			if (!current || dirty & /*secondSortingText*/ 4) set_data_dev(t4, /*secondSortingText*/ ctx[2]);
    			if (!current || dirty & /*firstSortingText*/ 8) set_data_dev(t6, /*firstSortingText*/ ctx[3]);

    			if (dirty & /*$soldItemList, seeItem*/ 768) {
    				each_value = /*$soldItemList*/ ctx[8];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div3, outro_and_destroy_block, create_each_block, null, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(82:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (78:2) {#if $soldItemList.length === 0}
    function create_if_block$3(ctx) {
    	let div0;
    	let t0;
    	let h2;
    	let t2;
    	let div1;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			h2 = element("h2");
    			h2.textContent = "No items are currently sold";
    			t2 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "spacer svelte-18ar49j");
    			add_location(div0, file$4, 78, 4, 2679);
    			attr_dev(h2, "class", "empty-text svelte-18ar49j");
    			add_location(h2, file$4, 79, 4, 2706);
    			attr_dev(div1, "class", "spacer svelte-18ar49j");
    			add_location(div1, file$4, 80, 4, 2766);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(78:2) {#if $soldItemList.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (96:6) {#each $soldItemList as soldItem (soldItem.milisecondCreated)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let solditem;
    	let current;

    	solditem = new SoldItem({
    			props: { soldItem: /*soldItem*/ ctx[17] },
    			$$inline: true
    		});

    	solditem.$on("seeItem", /*seeItem*/ ctx[9]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(solditem.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(solditem, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const solditem_changes = {};
    			if (dirty & /*$soldItemList*/ 256) solditem_changes.soldItem = /*soldItem*/ ctx[17];
    			solditem.$set(solditem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(solditem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(solditem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(solditem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(96:6) {#each $soldItemList as soldItem (soldItem.milisecondCreated)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let if_block0 = /*shelfState*/ ctx[0] === "one" && create_if_block_1$3(ctx);
    	const if_block_creators = [create_if_block$3, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$soldItemList*/ ctx[8].length === 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if_block1.c();
    			attr_dev(main, "class", "svelte-18ar49j");
    			add_location(main, file$4, 48, 0, 1608);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*shelfState*/ ctx[0] === "one") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$3(ctx);
    					if_block0.c();
    					if_block0.m(main, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function overallSortingTextGenerator(sortCondition) {
    	if (sortCondition[0]) {
    		return sortCondition[1] ? "From oldest" : "From newest";
    	} else {
    		return sortCondition[1]
    		? "Alphabetical order"
    		: "Reverse alphabetical order";
    	}
    }

    const click_handler = e => e.stopPropagation();

    function instance$4($$self, $$props, $$invalidate) {
    	let seenName;
    	let seenPrice;
    	let seenDescription;
    	let seenDate;
    	let firstSortingText;
    	let secondSortingText;
    	let overallSortingText;
    	let $sortCondition;
    	let $soldItemList;
    	validate_store(sortCondition, 'sortCondition');
    	component_subscribe($$self, sortCondition, $$value => $$invalidate(14, $sortCondition = $$value));
    	validate_store(soldItemList, 'soldItemList');
    	component_subscribe($$self, soldItemList, $$value => $$invalidate(8, $soldItemList = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Shelf', slots, []);
    	let shelfState = "all";
    	let seenItem;

    	function seeItem(e) {
    		$$invalidate(0, shelfState = "one");
    		const { detail } = e;
    		const { soldItem } = detail;
    		$$invalidate(13, seenItem = soldItem);
    	}

    	function handleBuySeenItem() {
    		soldItemList.remove(seenItem);
    		handleCloseSeeItem();
    	}

    	function handleCloseSeeItem() {
    		$$invalidate(0, shelfState = "all");
    		$$invalidate(13, seenItem = {});
    	}

    	function handleSortChanges(isOrder) {
    		if (isOrder) {
    			sortCondition.alternateSortOrder();
    		} else {
    			sortCondition.alternateSortBy();
    		}

    		soldItemList.resort($sortCondition);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Shelf> was created with unknown prop '${key}'`);
    	});

    	const click_handler_1 = () => handleSortChanges(true);
    	const click_handler_2 = () => handleSortChanges(false);

    	$$self.$capture_state = () => ({
    		soldItemList,
    		sortCondition,
    		priceDenominator,
    		SoldItem,
    		shelfState,
    		seenItem,
    		overallSortingTextGenerator,
    		seeItem,
    		handleBuySeenItem,
    		handleCloseSeeItem,
    		handleSortChanges,
    		overallSortingText,
    		secondSortingText,
    		firstSortingText,
    		seenDate,
    		seenDescription,
    		seenPrice,
    		seenName,
    		$sortCondition,
    		$soldItemList
    	});

    	$$self.$inject_state = $$props => {
    		if ('shelfState' in $$props) $$invalidate(0, shelfState = $$props.shelfState);
    		if ('seenItem' in $$props) $$invalidate(13, seenItem = $$props.seenItem);
    		if ('overallSortingText' in $$props) $$invalidate(1, overallSortingText = $$props.overallSortingText);
    		if ('secondSortingText' in $$props) $$invalidate(2, secondSortingText = $$props.secondSortingText);
    		if ('firstSortingText' in $$props) $$invalidate(3, firstSortingText = $$props.firstSortingText);
    		if ('seenDate' in $$props) $$invalidate(4, seenDate = $$props.seenDate);
    		if ('seenDescription' in $$props) $$invalidate(5, seenDescription = $$props.seenDescription);
    		if ('seenPrice' in $$props) $$invalidate(6, seenPrice = $$props.seenPrice);
    		if ('seenName' in $$props) $$invalidate(7, seenName = $$props.seenName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*seenItem*/ 8192) {
    			$$invalidate(7, seenName = seenItem === null || seenItem === void 0
    			? void 0
    			: seenItem.name);
    		}

    		if ($$self.$$.dirty & /*seenItem*/ 8192) {
    			$$invalidate(6, seenPrice = seenItem === null || seenItem === void 0
    			? void 0
    			: seenItem.price);
    		}

    		if ($$self.$$.dirty & /*seenItem*/ 8192) {
    			$$invalidate(5, seenDescription = seenItem === null || seenItem === void 0
    			? void 0
    			: seenItem.description);
    		}

    		if ($$self.$$.dirty & /*seenItem*/ 8192) {
    			$$invalidate(4, seenDate = seenItem === null || seenItem === void 0
    			? void 0
    			: seenItem.dateCreated);
    		}

    		if ($$self.$$.dirty & /*$sortCondition*/ 16384) {
    			$$invalidate(3, firstSortingText = $sortCondition[0] ? "Date" : "Name");
    		}

    		if ($$self.$$.dirty & /*$sortCondition*/ 16384) {
    			$$invalidate(2, secondSortingText = $sortCondition[1] ? "Ascending" : "Descending");
    		}

    		if ($$self.$$.dirty & /*$sortCondition*/ 16384) {
    			$$invalidate(1, overallSortingText = overallSortingTextGenerator($sortCondition));
    		}
    	};

    	return [
    		shelfState,
    		overallSortingText,
    		secondSortingText,
    		firstSortingText,
    		seenDate,
    		seenDescription,
    		seenPrice,
    		seenName,
    		$soldItemList,
    		seeItem,
    		handleBuySeenItem,
    		handleCloseSeeItem,
    		handleSortChanges,
    		seenItem,
    		$sortCondition,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Shelf extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shelf",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.48.0 */

    const { console: console_1$1 } = globals;
    const file$3 = "src/components/Footer.svelte";

    // (59:2) {#if !validInput}
    function create_if_block_3(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*inputProblem*/ ctx[4] === "overdraw") return create_if_block_4;
    		if (/*inputProblem*/ ctx[4] === "NaN" || /*inputProblem*/ ctx[4] === "negative") return create_if_block_5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(59:2) {#if !validInput}",
    		ctx
    	});

    	return block;
    }

    // (64:68) 
    function create_if_block_5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please enter a positive number";
    			attr_dev(p, "class", "warning-text svelte-v3057e");
    			add_location(p, file$3, 64, 6, 1706);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(64:68) ",
    		ctx
    	});

    	return block;
    }

    // (60:4) {#if inputProblem === "overdraw"}
    function create_if_block_4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "You can't withdraw more than the canteen balance";
    			attr_dev(p, "class", "warning-text svelte-v3057e");
    			add_location(p, file$3, 60, 6, 1538);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(60:4) {#if inputProblem === \\\"overdraw\\\"}",
    		ctx
    	});

    	return block;
    }

    // (85:4) {:else}
    function create_else_block(ctx) {
    	let button0;
    	let i;
    	let t0;
    	let div;
    	let p;
    	let t2;
    	let input;
    	let t3;
    	let button1;
    	let mounted;
    	let dispose;

    	function select_block_type_2(ctx, dirty) {
    		if (/*footerState*/ ctx[0] === "give") return create_if_block_1$2;
    		if (/*footerState*/ ctx[0] === "take") return create_if_block_2;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			i = element("i");
    			t0 = space();
    			div = element("div");
    			p = element("p");
    			p.textContent = "Rp";
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			button1 = element("button");
    			if (if_block) if_block.c();
    			attr_dev(i, "class", "fa-solid fa-share fa-flip-horizontal money-icon svelte-v3057e");
    			add_location(i, file$3, 86, 8, 2600);
    			attr_dev(button0, "class", "operate-button cancel-button svelte-v3057e");
    			add_location(button0, file$3, 85, 6, 2529);
    			attr_dev(p, "class", "svelte-v3057e");
    			add_location(p, file$3, 89, 8, 2722);
    			attr_dev(input, "class", "input-operator svelte-v3057e");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "placeholder", "0");
    			add_location(input, file$3, 90, 8, 2740);
    			attr_dev(div, "class", "input-container svelte-v3057e");
    			add_location(div, file$3, 88, 6, 2684);
    			attr_dev(button1, "class", "operate-button svelte-v3057e");
    			toggle_class(button1, "invalid-operate-button", !/*validInput*/ ctx[3]);
    			add_location(button1, file$3, 107, 6, 3151);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, i);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(div, t2);
    			append_dev(div, input);
    			set_input_value(input, /*inputtedNumber*/ ctx[1]);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button1, anchor);
    			if (if_block) if_block.m(button1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*reset*/ ctx[5], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    					listen_dev(input, "keydown", /*keydown_handler*/ ctx[10], false, false, false),
    					listen_dev(input, "keyup", /*keyup_handler*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*handleOperate*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*inputtedNumber*/ 2 && to_number(input.value) !== /*inputtedNumber*/ ctx[1]) {
    				set_input_value(input, /*inputtedNumber*/ ctx[1]);
    			}

    			if (current_block_type !== (current_block_type = select_block_type_2(ctx))) {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button1, null);
    				}
    			}

    			if (dirty & /*validInput*/ 8) {
    				toggle_class(button1, "invalid-operate-button", !/*validInput*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button1);

    			if (if_block) {
    				if_block.d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(85:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (69:4) {#if footerState === "default"}
    function create_if_block$2(ctx) {
    	let button0;
    	let i0;
    	let t0;
    	let div1;
    	let div0;
    	let i1;
    	let t1;
    	let p;
    	let t2_value = priceDenominator(/*$storeBalance*/ ctx[2]) + "";
    	let t2;
    	let t3;
    	let button1;
    	let i2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			i0 = element("i");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			i1 = element("i");
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			button1 = element("button");
    			i2 = element("i");
    			attr_dev(i0, "class", "fa-solid fa-right-from-bracket fa-rotate-270 money-icon svelte-v3057e");
    			add_location(i0, file$3, 70, 8, 1936);
    			attr_dev(button0, "class", "money-button svelte-v3057e");
    			add_location(button0, file$3, 69, 6, 1858);
    			attr_dev(i1, "class", "fa-solid fa-money-bill-wave money-icon svelte-v3057e");
    			add_location(i1, file$3, 76, 10, 2152);
    			attr_dev(p, "class", "store-balance svelte-v3057e");
    			add_location(p, file$3, 77, 10, 2215);
    			attr_dev(div0, "class", "money-container-second svelte-v3057e");
    			add_location(div0, file$3, 75, 8, 2105);
    			attr_dev(div1, "class", "money-container svelte-v3057e");
    			add_location(div1, file$3, 74, 6, 2067);
    			attr_dev(i2, "class", "fa-solid fa-right-to-bracket fa-rotate-90 money-icon svelte-v3057e");
    			add_location(i2, file$3, 82, 8, 2428);
    			attr_dev(button1, "class", "money-button svelte-v3057e");
    			add_location(button1, file$3, 81, 6, 2350);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, i0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, i1);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(p, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button1, anchor);
    			append_dev(button1, i2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$storeBalance*/ 4 && t2_value !== (t2_value = priceDenominator(/*$storeBalance*/ ctx[2]) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(69:4) {#if footerState === \\\"default\\\"}",
    		ctx
    	});

    	return block;
    }

    // (115:41) 
    function create_if_block_2(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fa-solid fa-right-from-bracket fa-rotate-270 money-icon svelte-v3057e");
    			add_location(i, file$3, 115, 10, 3448);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(115:41) ",
    		ctx
    	});

    	return block;
    }

    // (113:8) {#if footerState === "give"}
    function create_if_block_1$2(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fa-solid fa-right-to-bracket fa-rotate-90 money-icon svelte-v3057e");
    			add_location(i, file$3, 113, 10, 3329);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(113:8) {#if footerState === \\\"give\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let head;
    	let script;
    	let script_src_value;
    	let t0;
    	let link;
    	let t1;
    	let main;
    	let t2;
    	let div;
    	let if_block0 = !/*validInput*/ ctx[3] && create_if_block_3(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*footerState*/ ctx[0] === "default") return create_if_block$2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			head = element("head");
    			script = element("script");
    			t0 = space();
    			link = element("link");
    			t1 = space();
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t2 = space();
    			div = element("div");
    			if_block1.c();
    			if (!src_url_equal(script.src, script_src_value = "https://kit.fontawesome.com/31a5898fa1.js")) attr_dev(script, "src", script_src_value);
    			attr_dev(script, "crossorigin", "anonymous");
    			add_location(script, file$3, 45, 2, 1062);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta2/css/all.min.css");
    			attr_dev(link, "integrity", "sha512-YWzhKL2whUzgiheMoBFwW8CKV4qpHQAEuvilg9FAn5VJUDwKZZxkJNuGM4XkWuk94WCrrwslk8yWNGmY1EduTA==");
    			attr_dev(link, "crossorigin", "anonymous");
    			attr_dev(link, "referrerpolicy", "no-referrer");
    			add_location(link, file$3, 48, 2, 1162);
    			add_location(head, file$3, 44, 0, 1053);
    			attr_dev(div, "class", "footer-container svelte-v3057e");
    			add_location(div, file$3, 67, 2, 1785);
    			attr_dev(main, "class", "svelte-v3057e");
    			add_location(main, file$3, 57, 0, 1467);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, head, anchor);
    			append_dev(head, script);
    			append_dev(head, t0);
    			append_dev(head, link);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t2);
    			append_dev(main, div);
    			if_block1.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*validInput*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(main, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(head);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $storeBalance;
    	validate_store(storeBalance, 'storeBalance');
    	component_subscribe($$self, storeBalance, $$value => $$invalidate(2, $storeBalance = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	let footerState = "default";
    	let inputtedNumber = undefined;
    	let validInput = true;
    	let inputProblem = "none";

    	function reset() {
    		$$invalidate(1, inputtedNumber = undefined);
    		$$invalidate(0, footerState = "default");
    	}

    	function handleOperate() {

    		if (!validInput) {
    			return;
    		}

    		if (footerState === "give") {
    			storeBalance.add(inputtedNumber);
    		} else if (footerState === "take") {
    			storeBalance.subtract(inputtedNumber);
    		}

    		{
    			reset();
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, footerState = "take");
    	const click_handler_1 = () => $$invalidate(0, footerState = "give");

    	function input_input_handler() {
    		inputtedNumber = to_number(this.value);
    		$$invalidate(1, inputtedNumber);
    	}

    	const keydown_handler = ({ key }) => {
    		if (key == "Enter") {
    			handleOperate();
    			return;
    		}
    	};

    	const keyup_handler = () => {
    		console.log(inputtedNumber);
    	};

    	$$self.$capture_state = () => ({
    		storeBalance,
    		priceDenominator,
    		footerState,
    		inputtedNumber,
    		validInput,
    		inputProblem,
    		reset,
    		handleOperate,
    		$storeBalance
    	});

    	$$self.$inject_state = $$props => {
    		if ('footerState' in $$props) $$invalidate(0, footerState = $$props.footerState);
    		if ('inputtedNumber' in $$props) $$invalidate(1, inputtedNumber = $$props.inputtedNumber);
    		if ('validInput' in $$props) $$invalidate(3, validInput = $$props.validInput);
    		if ('inputProblem' in $$props) $$invalidate(4, inputProblem = $$props.inputProblem);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*footerState, inputtedNumber, $storeBalance*/ 7) {
    			{
    				if (footerState === "take" && inputtedNumber > $storeBalance) {
    					$$invalidate(3, validInput = false);
    					$$invalidate(4, inputProblem = "overdraw");
    				} else if (inputtedNumber === null) {
    					$$invalidate(3, validInput = false);
    					$$invalidate(4, inputProblem = "NaN");
    				} else if (inputtedNumber < 0) {
    					$$invalidate(3, validInput = false);
    					$$invalidate(4, inputProblem = "negative");
    				} else {
    					$$invalidate(3, validInput = true);
    				}
    			}
    		}
    	};

    	return [
    		footerState,
    		inputtedNumber,
    		$storeBalance,
    		validInput,
    		inputProblem,
    		reset,
    		handleOperate,
    		click_handler,
    		click_handler_1,
    		input_input_handler,
    		keydown_handler,
    		keyup_handler
    	];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/NewItemForm.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;
    const file$2 = "src/components/NewItemForm.svelte";

    // (172:10) {#key imageInputKey}
    function create_key_block$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "id", "image-input");
    			attr_dev(input, "name", "image-input");
    			attr_dev(input, "type", "file");
    			attr_dev(input, "accept", "image/png, image/jpeg");
    			attr_dev(input, "class", "svelte-fvbh07");
    			add_location(input, file$2, 172, 12, 4355);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[23]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block$1.name,
    		type: "key",
    		source: "(172:10) {#key imageInputKey}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let head;
    	let script;
    	let script_src_value;
    	let t0;
    	let link;
    	let t1;
    	let main;
    	let div9;
    	let h2;
    	let t3;
    	let form;
    	let div1;
    	let label0;
    	let t5;
    	let div0;
    	let previous_key = /*imageInputKey*/ ctx[10];
    	let t6;
    	let p0;
    	let t7;
    	let t8;
    	let div3;
    	let label1;
    	let t9;
    	let t10_value = `${/*name*/ ctx[0].length} / ${maxNameLength}` + "";
    	let t10;
    	let t11;
    	let t12;
    	let div2;
    	let input0;
    	let t13;
    	let p1;
    	let t14;
    	let t15;
    	let div5;
    	let label2;
    	let t17;
    	let div4;
    	let input1;
    	let t18;
    	let p2;
    	let t19;
    	let t20;
    	let div7;
    	let label3;
    	let t21;
    	let t22_value = `${/*description*/ ctx[2].length} / ${maxDescriptionLength}` + "";
    	let t22;
    	let t23;
    	let t24;
    	let div6;
    	let textarea;
    	let t25;
    	let p3;
    	let t26;
    	let t27;
    	let div8;
    	let button0;
    	let t29;
    	let p4;
    	let t31;
    	let button1;
    	let t32;
    	let button1_disabled_value;
    	let mounted;
    	let dispose;
    	let key_block = create_key_block$1(ctx);

    	const block = {
    		c: function create() {
    			head = element("head");
    			script = element("script");
    			t0 = space();
    			link = element("link");
    			t1 = space();
    			main = element("main");
    			div9 = element("div");
    			h2 = element("h2");
    			h2.textContent = "What's the item?";
    			t3 = space();
    			form = element("form");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Any photo of it? (JPG or PNG)";
    			t5 = space();
    			div0 = element("div");
    			key_block.c();
    			t6 = space();
    			p0 = element("p");
    			t7 = text(/*imageWarningText*/ ctx[18]);
    			t8 = space();
    			div3 = element("div");
    			label1 = element("label");
    			t9 = text("What's its name? (");
    			t10 = text(t10_value);
    			t11 = text(")");
    			t12 = space();
    			div2 = element("div");
    			input0 = element("input");
    			t13 = space();
    			p1 = element("p");
    			t14 = text(/*nameWarningText*/ ctx[15]);
    			t15 = space();
    			div5 = element("div");
    			label2 = element("label");
    			label2.textContent = "What is it worth? (Rp)";
    			t17 = space();
    			div4 = element("div");
    			input1 = element("input");
    			t18 = space();
    			p2 = element("p");
    			t19 = text(/*priceWarningText*/ ctx[17]);
    			t20 = space();
    			div7 = element("div");
    			label3 = element("label");
    			t21 = text("Describe it (");
    			t22 = text(t22_value);
    			t23 = text(")");
    			t24 = space();
    			div6 = element("div");
    			textarea = element("textarea");
    			t25 = space();
    			p3 = element("p");
    			t26 = text(/*descriptionWarningText*/ ctx[16]);
    			t27 = space();
    			div8 = element("div");
    			button0 = element("button");
    			button0.textContent = "Back";
    			t29 = space();
    			p4 = element("p");
    			p4.textContent = "Item succesfully added";
    			t31 = space();
    			button1 = element("button");
    			t32 = text("Sell");
    			if (!src_url_equal(script.src, script_src_value = "https://kit.fontawesome.com/31a5898fa1.js")) attr_dev(script, "src", script_src_value);
    			attr_dev(script, "crossorigin", "anonymous");
    			add_location(script, file$2, 152, 2, 3608);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta2/css/all.min.css");
    			attr_dev(link, "integrity", "sha512-YWzhKL2whUzgiheMoBFwW8CKV4qpHQAEuvilg9FAn5VJUDwKZZxkJNuGM4XkWuk94WCrrwslk8yWNGmY1EduTA==");
    			attr_dev(link, "crossorigin", "anonymous");
    			attr_dev(link, "referrerpolicy", "no-referrer");
    			add_location(link, file$2, 155, 2, 3708);
    			add_location(head, file$2, 151, 0, 3599);
    			attr_dev(h2, "class", "title svelte-fvbh07");
    			add_location(h2, file$2, 166, 4, 4093);
    			attr_dev(label0, "for", "image-input");
    			attr_dev(label0, "class", "svelte-fvbh07");
    			add_location(label0, file$2, 169, 8, 4211);
    			attr_dev(p0, "class", "input-warning svelte-fvbh07");
    			toggle_class(p0, "input-not-valid-warning", !/*imageValid*/ ctx[5] && !/*imageJustStarted*/ ctx[14]);
    			add_location(p0, file$2, 181, 10, 4613);
    			attr_dev(div0, "class", "input-container svelte-fvbh07");
    			add_location(div0, file$2, 170, 8, 4282);
    			attr_dev(div1, "class", "input-element svelte-fvbh07");
    			add_location(div1, file$2, 168, 6, 4175);
    			attr_dev(label1, "for", "name-input");
    			attr_dev(label1, "class", "svelte-fvbh07");
    			add_location(label1, file$2, 190, 8, 4855);
    			attr_dev(input0, "id", "name-input");
    			attr_dev(input0, "name", "name-input");
    			attr_dev(input0, "class", "svelte-fvbh07");
    			add_location(input0, file$2, 194, 10, 5012);
    			attr_dev(p1, "class", "input-warning svelte-fvbh07");
    			toggle_class(p1, "input-not-valid-warning", !/*nameValid*/ ctx[8] && !/*nameJustStarted*/ ctx[11]);
    			add_location(p1, file$2, 195, 10, 5084);
    			attr_dev(div2, "class", "input-container svelte-fvbh07");
    			add_location(div2, file$2, 193, 8, 4972);
    			attr_dev(div3, "class", "input-element svelte-fvbh07");
    			add_location(div3, file$2, 189, 6, 4819);
    			attr_dev(label2, "for", "price-input");
    			attr_dev(label2, "class", "svelte-fvbh07");
    			add_location(label2, file$2, 204, 8, 5323);
    			attr_dev(input1, "id", "price-input");
    			attr_dev(input1, "name", "price-input");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "class", "svelte-fvbh07");
    			add_location(input1, file$2, 206, 10, 5427);
    			attr_dev(p2, "class", "input-warning svelte-fvbh07");
    			toggle_class(p2, "input-not-valid-warning", !/*priceValid*/ ctx[7] && !/*priceJustStarted*/ ctx[12]);
    			add_location(p2, file$2, 213, 10, 5594);
    			attr_dev(div4, "class", "input-container svelte-fvbh07");
    			add_location(div4, file$2, 205, 8, 5387);
    			attr_dev(div5, "class", "input-element svelte-fvbh07");
    			add_location(div5, file$2, 203, 6, 5287);
    			attr_dev(label3, "for", "description-input");
    			attr_dev(label3, "class", "svelte-fvbh07");
    			add_location(label3, file$2, 222, 8, 5836);
    			attr_dev(textarea, "id", "description-input");
    			attr_dev(textarea, "name", "description");
    			attr_dev(textarea, "type", "text");
    			attr_dev(textarea, "min", "0");
    			attr_dev(textarea, "rows", "5");
    			attr_dev(textarea, "cols", "20");
    			attr_dev(textarea, "class", "svelte-fvbh07");
    			add_location(textarea, file$2, 226, 10, 6009);
    			attr_dev(p3, "class", "input-warning svelte-fvbh07");
    			toggle_class(p3, "input-not-valid-warning", !/*descriptionValid*/ ctx[6] && !/*descriptionJustStarted*/ ctx[13]);
    			add_location(p3, file$2, 235, 10, 6232);
    			attr_dev(div6, "class", "input-container svelte-fvbh07");
    			add_location(div6, file$2, 225, 8, 5969);
    			attr_dev(div7, "class", "input-element svelte-fvbh07");
    			add_location(div7, file$2, 221, 6, 5800);
    			attr_dev(button0, "class", "return-button svelte-fvbh07");
    			attr_dev(button0, "type", "button");
    			add_location(button0, file$2, 245, 8, 6509);
    			attr_dev(p4, "class", "success-text svelte-fvbh07");
    			toggle_class(p4, "success-text-shown", /*showingSuccessText*/ ctx[9]);
    			add_location(p4, file$2, 252, 8, 6673);
    			attr_dev(button1, "class", "submit-button svelte-fvbh07");
    			attr_dev(button1, "type", "submit");
    			button1.disabled = button1_disabled_value = !/*dataValid*/ ctx[19];
    			toggle_class(button1, "submit-button-disabled", !/*dataValid*/ ctx[19]);
    			add_location(button1, file$2, 256, 8, 6838);
    			attr_dev(div8, "class", "button-container svelte-fvbh07");
    			add_location(div8, file$2, 244, 6, 6470);
    			attr_dev(form, "class", "svelte-fvbh07");
    			add_location(form, file$2, 167, 4, 4137);
    			attr_dev(div9, "class", "form-container svelte-fvbh07");
    			add_location(div9, file$2, 165, 2, 4060);
    			attr_dev(main, "class", "svelte-fvbh07");
    			add_location(main, file$2, 164, 0, 4013);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, head, anchor);
    			append_dev(head, script);
    			append_dev(head, t0);
    			append_dev(head, link);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div9);
    			append_dev(div9, h2);
    			append_dev(div9, t3);
    			append_dev(div9, form);
    			append_dev(form, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			key_block.m(div0, null);
    			append_dev(div0, t6);
    			append_dev(div0, p0);
    			append_dev(p0, t7);
    			append_dev(form, t8);
    			append_dev(form, div3);
    			append_dev(div3, label1);
    			append_dev(label1, t9);
    			append_dev(label1, t10);
    			append_dev(label1, t11);
    			append_dev(div3, t12);
    			append_dev(div3, div2);
    			append_dev(div2, input0);
    			set_input_value(input0, /*name*/ ctx[0]);
    			append_dev(div2, t13);
    			append_dev(div2, p1);
    			append_dev(p1, t14);
    			append_dev(form, t15);
    			append_dev(form, div5);
    			append_dev(div5, label2);
    			append_dev(div5, t17);
    			append_dev(div5, div4);
    			append_dev(div4, input1);
    			set_input_value(input1, /*price*/ ctx[1]);
    			append_dev(div4, t18);
    			append_dev(div4, p2);
    			append_dev(p2, t19);
    			append_dev(form, t20);
    			append_dev(form, div7);
    			append_dev(div7, label3);
    			append_dev(label3, t21);
    			append_dev(label3, t22);
    			append_dev(label3, t23);
    			append_dev(div7, t24);
    			append_dev(div7, div6);
    			append_dev(div6, textarea);
    			set_input_value(textarea, /*description*/ ctx[2]);
    			append_dev(div6, t25);
    			append_dev(div6, p3);
    			append_dev(p3, t26);
    			append_dev(form, t27);
    			append_dev(form, div8);
    			append_dev(div8, button0);
    			append_dev(div8, t29);
    			append_dev(div8, p4);
    			append_dev(div8, t31);
    			append_dev(div8, button1);
    			append_dev(button1, t32);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[24]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[25]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[26]),
    					listen_dev(button0, "click", /*click_handler*/ ctx[27], false, false, false),
    					listen_dev(form, "submit", /*handleSubmit*/ ctx[20], false, false, false),
    					listen_dev(main, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imageInputKey*/ 1024 && safe_not_equal(previous_key, previous_key = /*imageInputKey*/ ctx[10])) {
    				key_block.d(1);
    				key_block = create_key_block$1(ctx);
    				key_block.c();
    				key_block.m(div0, t6);
    			} else {
    				key_block.p(ctx, dirty);
    			}

    			if (dirty & /*imageWarningText*/ 262144) set_data_dev(t7, /*imageWarningText*/ ctx[18]);

    			if (dirty & /*imageValid, imageJustStarted*/ 16416) {
    				toggle_class(p0, "input-not-valid-warning", !/*imageValid*/ ctx[5] && !/*imageJustStarted*/ ctx[14]);
    			}

    			if (dirty & /*name*/ 1 && t10_value !== (t10_value = `${/*name*/ ctx[0].length} / ${maxNameLength}` + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*name*/ 1 && input0.value !== /*name*/ ctx[0]) {
    				set_input_value(input0, /*name*/ ctx[0]);
    			}

    			if (dirty & /*nameWarningText*/ 32768) set_data_dev(t14, /*nameWarningText*/ ctx[15]);

    			if (dirty & /*nameValid, nameJustStarted*/ 2304) {
    				toggle_class(p1, "input-not-valid-warning", !/*nameValid*/ ctx[8] && !/*nameJustStarted*/ ctx[11]);
    			}

    			if (dirty & /*price*/ 2 && to_number(input1.value) !== /*price*/ ctx[1]) {
    				set_input_value(input1, /*price*/ ctx[1]);
    			}

    			if (dirty & /*priceWarningText*/ 131072) set_data_dev(t19, /*priceWarningText*/ ctx[17]);

    			if (dirty & /*priceValid, priceJustStarted*/ 4224) {
    				toggle_class(p2, "input-not-valid-warning", !/*priceValid*/ ctx[7] && !/*priceJustStarted*/ ctx[12]);
    			}

    			if (dirty & /*description*/ 4 && t22_value !== (t22_value = `${/*description*/ ctx[2].length} / ${maxDescriptionLength}` + "")) set_data_dev(t22, t22_value);

    			if (dirty & /*description*/ 4) {
    				set_input_value(textarea, /*description*/ ctx[2]);
    			}

    			if (dirty & /*descriptionWarningText*/ 65536) set_data_dev(t26, /*descriptionWarningText*/ ctx[16]);

    			if (dirty & /*descriptionValid, descriptionJustStarted*/ 8256) {
    				toggle_class(p3, "input-not-valid-warning", !/*descriptionValid*/ ctx[6] && !/*descriptionJustStarted*/ ctx[13]);
    			}

    			if (dirty & /*showingSuccessText*/ 512) {
    				toggle_class(p4, "success-text-shown", /*showingSuccessText*/ ctx[9]);
    			}

    			if (dirty & /*dataValid*/ 524288 && button1_disabled_value !== (button1_disabled_value = !/*dataValid*/ ctx[19])) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty & /*dataValid*/ 524288) {
    				toggle_class(button1, "submit-button-disabled", !/*dataValid*/ ctx[19]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(head);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			key_block.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const click_handler_1 = e => e.stopPropagation();

    function instance$2($$self, $$props, $$invalidate) {
    	let nameValid;
    	let priceValid;
    	let descriptionValid;
    	let imageValid;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NewItemForm', slots, []);
    	let showingSuccessText = false;
    	let imageInputKey = {};
    	let name = "";
    	let price = undefined;
    	let description = "";
    	let imageFilename = null;
    	let image = null;
    	let nameProblem = "empty";
    	let descriptionProblem = "empty";
    	let nameJustStarted = true;
    	let priceJustStarted = true;
    	let descriptionJustStarted = true;
    	let imageJustStarted = true;
    	let nameWarningText = "";
    	let descriptionWarningText = "";
    	let priceWarningText = "";
    	let imageWarningText = "";
    	let dataValid = false;

    	// let imageLink : string;
    	function reset() {
    		$$invalidate(10, imageInputKey = {});
    		$$invalidate(0, name = "");
    		$$invalidate(1, price = undefined);
    		$$invalidate(2, description = "");
    		$$invalidate(3, imageFilename = null);
    		$$invalidate(4, image = null);
    		$$invalidate(11, nameJustStarted = true);
    		$$invalidate(12, priceJustStarted = true);
    		$$invalidate(13, descriptionJustStarted = true);
    		$$invalidate(14, imageJustStarted = true);
    	}

    	function handleSubmit(e) {
    		e.preventDefault();
    		console.log("Is submitting");
    		const newSoldItem = { name, price, description }; // image: image[0],
    		soldItemList.insert(newSoldItem);
    		$$invalidate(9, showingSuccessText = true);
    		reset();

    		setTimeout(
    			() => {
    				$$invalidate(9, showingSuccessText = false);
    			},
    			successTextDuration
    		);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<NewItemForm> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		imageFilename = this.value;
    		image = this.files;
    		$$invalidate(3, imageFilename);
    		$$invalidate(4, image);
    	}

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function input1_input_handler() {
    		price = to_number(this.value);
    		$$invalidate(1, price);
    	}

    	function textarea_input_handler() {
    		description = this.value;
    		$$invalidate(2, description);
    	}

    	const click_handler = () => appState.set("trade");

    	$$self.$capture_state = () => ({
    		maxDescriptionLength,
    		maxNameLength,
    		successTextDuration,
    		appState,
    		soldItemList,
    		validImageChecker,
    		showingSuccessText,
    		imageInputKey,
    		name,
    		price,
    		description,
    		imageFilename,
    		image,
    		nameProblem,
    		descriptionProblem,
    		nameJustStarted,
    		priceJustStarted,
    		descriptionJustStarted,
    		imageJustStarted,
    		nameWarningText,
    		descriptionWarningText,
    		priceWarningText,
    		imageWarningText,
    		dataValid,
    		reset,
    		handleSubmit,
    		imageValid,
    		descriptionValid,
    		priceValid,
    		nameValid
    	});

    	$$self.$inject_state = $$props => {
    		if ('showingSuccessText' in $$props) $$invalidate(9, showingSuccessText = $$props.showingSuccessText);
    		if ('imageInputKey' in $$props) $$invalidate(10, imageInputKey = $$props.imageInputKey);
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('price' in $$props) $$invalidate(1, price = $$props.price);
    		if ('description' in $$props) $$invalidate(2, description = $$props.description);
    		if ('imageFilename' in $$props) $$invalidate(3, imageFilename = $$props.imageFilename);
    		if ('image' in $$props) $$invalidate(4, image = $$props.image);
    		if ('nameProblem' in $$props) $$invalidate(21, nameProblem = $$props.nameProblem);
    		if ('descriptionProblem' in $$props) $$invalidate(22, descriptionProblem = $$props.descriptionProblem);
    		if ('nameJustStarted' in $$props) $$invalidate(11, nameJustStarted = $$props.nameJustStarted);
    		if ('priceJustStarted' in $$props) $$invalidate(12, priceJustStarted = $$props.priceJustStarted);
    		if ('descriptionJustStarted' in $$props) $$invalidate(13, descriptionJustStarted = $$props.descriptionJustStarted);
    		if ('imageJustStarted' in $$props) $$invalidate(14, imageJustStarted = $$props.imageJustStarted);
    		if ('nameWarningText' in $$props) $$invalidate(15, nameWarningText = $$props.nameWarningText);
    		if ('descriptionWarningText' in $$props) $$invalidate(16, descriptionWarningText = $$props.descriptionWarningText);
    		if ('priceWarningText' in $$props) $$invalidate(17, priceWarningText = $$props.priceWarningText);
    		if ('imageWarningText' in $$props) $$invalidate(18, imageWarningText = $$props.imageWarningText);
    		if ('dataValid' in $$props) $$invalidate(19, dataValid = $$props.dataValid);
    		if ('imageValid' in $$props) $$invalidate(5, imageValid = $$props.imageValid);
    		if ('descriptionValid' in $$props) $$invalidate(6, descriptionValid = $$props.descriptionValid);
    		if ('priceValid' in $$props) $$invalidate(7, priceValid = $$props.priceValid);
    		if ('nameValid' in $$props) $$invalidate(8, nameValid = $$props.nameValid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*name*/ 1) {
    			{
    				if (name === "") {
    					$$invalidate(21, nameProblem = "empty");
    				} else if (name.length > maxNameLength) {
    					$$invalidate(21, nameProblem = "long");
    				} else {
    					$$invalidate(21, nameProblem = "none");
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*nameProblem*/ 2097152) {
    			$$invalidate(8, nameValid = nameProblem === "none");
    		}

    		if ($$self.$$.dirty & /*price*/ 2) {
    			$$invalidate(7, priceValid = price > 0 && price !== null);
    		}

    		if ($$self.$$.dirty & /*description*/ 4) {
    			{
    				if (description === "") {
    					$$invalidate(22, descriptionProblem = "empty");
    				} else if (description.length > maxDescriptionLength) {
    					$$invalidate(22, descriptionProblem = "long");
    				} else {
    					$$invalidate(22, descriptionProblem = "none");
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*descriptionProblem*/ 4194304) {
    			$$invalidate(6, descriptionValid = descriptionProblem === "none");
    		}

    		if ($$self.$$.dirty & /*imageFilename, image*/ 24) {
    			$$invalidate(5, imageValid = validImageChecker(imageFilename) && image !== null);
    		}

    		if ($$self.$$.dirty & /*nameValid, priceValid, descriptionValid, imageValid*/ 480) {
    			$$invalidate(19, dataValid = [nameValid, priceValid, descriptionValid, imageValid].every(validity => validity === true));
    		}

    		if ($$self.$$.dirty & /*name*/ 1) {
    			{
    				if (name !== "") {
    					$$invalidate(11, nameJustStarted = false);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*description*/ 4) {
    			{
    				if (description !== "") {
    					$$invalidate(13, descriptionJustStarted = false);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*nameProblem*/ 2097152) {
    			{
    				if (nameProblem === "none") {
    					$$invalidate(15, nameWarningText = "");
    				} else if (nameProblem === "empty") {
    					$$invalidate(15, nameWarningText = "Please enter a name");
    				} else if (nameProblem === "long") {
    					$$invalidate(15, nameWarningText = "Name entered is too long");
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*descriptionProblem*/ 4194304) {
    			{
    				if (descriptionProblem === "none") {
    					$$invalidate(16, descriptionWarningText = "");
    				} else if (descriptionProblem === "empty") {
    					$$invalidate(16, descriptionWarningText = "Please enter a description");
    				} else if (descriptionProblem === "long") {
    					$$invalidate(16, descriptionWarningText = "Description entered is too long");
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*priceValid*/ 128) {
    			{
    				if (!priceValid) {
    					$$invalidate(17, priceWarningText = "Please enter a positive number");
    				} else {
    					$$invalidate(17, priceWarningText = "");
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*price*/ 2) {
    			{
    				if (price !== undefined) {
    					$$invalidate(12, priceJustStarted = false);
    				} else {
    					$$invalidate(12, priceJustStarted = true);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*imageValid, image*/ 48) {
    			{
    				if (!imageValid) {
    					$$invalidate(18, imageWarningText = "Not an acceptable image");
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*imageFilename*/ 8) {
    			{
    				if (imageFilename !== null) {
    					$$invalidate(14, imageJustStarted = false);
    				} else {
    					$$invalidate(14, imageJustStarted = true);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*imageFilename*/ 8) {
    			{
    				if (!validImageChecker(imageFilename)) {
    					$$invalidate(18, imageWarningText = "Invalid type of image");
    				} else if (imageFilename === null) {
    					$$invalidate(18, imageWarningText = "Please upload an image");
    				}
    			}
    		}
    	};

    	return [
    		name,
    		price,
    		description,
    		imageFilename,
    		image,
    		imageValid,
    		descriptionValid,
    		priceValid,
    		nameValid,
    		showingSuccessText,
    		imageInputKey,
    		nameJustStarted,
    		priceJustStarted,
    		descriptionJustStarted,
    		imageJustStarted,
    		nameWarningText,
    		descriptionWarningText,
    		priceWarningText,
    		imageWarningText,
    		dataValid,
    		handleSubmit,
    		nameProblem,
    		descriptionProblem,
    		input_change_handler,
    		input0_input_handler,
    		input1_input_handler,
    		textarea_input_handler,
    		click_handler
    	];
    }

    class NewItemForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NewItemForm",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Store.svelte generated by Svelte v3.48.0 */
    const file$1 = "src/components/Store.svelte";

    // (18:34) 
    function create_if_block_1$1(ctx) {
    	let shelf;
    	let t;
    	let footer;
    	let current;
    	shelf = new Shelf({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(shelf.$$.fragment);
    			t = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(shelf, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shelf.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shelf.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shelf, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(18:34) ",
    		ctx
    	});

    	return block;
    }

    // (14:2) {#if $appState === "add"}
    function create_if_block$1(ctx) {
    	let previous_key = /*formKey*/ ctx[0];
    	let key_block_anchor;
    	let current;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*formKey*/ 1 && safe_not_equal(previous_key, previous_key = /*formKey*/ ctx[0])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block, 1);
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(14:2) {#if $appState === \\\"add\\\"}",
    		ctx
    	});

    	return block;
    }

    // (15:4) {#key formKey}
    function create_key_block(ctx) {
    	let newitemform;
    	let current;
    	newitemform = new NewItemForm({ $$inline: true });
    	newitemform.$on("reset", /*resetForm*/ ctx[2]);

    	const block = {
    		c: function create() {
    			create_component(newitemform.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(newitemform, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(newitemform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(newitemform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(newitemform, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(15:4) {#key formKey}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let header;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	header = new Header({ $$inline: true });
    	const if_block_creators = [create_if_block$1, create_if_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$appState*/ ctx[1] === "add") return 0;
    		if (/*$appState*/ ctx[1] === "trade") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(header.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(main, "class", "svelte-1bj5t2p");
    			add_location(main, file$1, 11, 0, 288);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $appState;
    	validate_store(appState, 'appState');
    	component_subscribe($$self, appState, $$value => $$invalidate(1, $appState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Store', slots, []);
    	let formKey = {};

    	function resetForm() {
    		$$invalidate(0, formKey = {});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Store> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		Shelf,
    		Footer,
    		appState,
    		NewItemForm,
    		formKey,
    		resetForm,
    		$appState
    	});

    	$$self.$inject_state = $$props => {
    		if ('formKey' in $$props) $$invalidate(0, formKey = $$props.formKey);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [formKey, $appState, resetForm];
    }

    class Store extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Store",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */
    const file = "src/App.svelte";

    // (21:57) 
    function create_if_block_1(ctx) {
    	let store;
    	let current;
    	store = new Store({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(store.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(store, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(store.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(store.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(store, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(21:57) ",
    		ctx
    	});

    	return block;
    }

    // (19:2) {#if $appState === "startPage"}
    function create_if_block(ctx) {
    	let startpage;
    	let current;
    	startpage = new StartPage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(startpage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(startpage, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(startpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(startpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(startpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(19:2) {#if $appState === \\\"startPage\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$appState*/ ctx[0] === "startPage") return 0;
    		if (/*$appState*/ ctx[0] === "trade" || /*$appState*/ ctx[0] === "add") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			attr_dev(main, "class", "svelte-lwkp3t");
    			add_location(main, file, 17, 0, 480);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $appState;
    	validate_store(appState, 'appState');
    	component_subscribe($$self, appState, $$value => $$invalidate(0, $appState = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	onMount(async () => {
    		
    	}); // try {
    	//   const response = await fetch(`${backendAddress}/test`);
    	//   console.log(response);
    	// } catch (error) {

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		StartPage,
    		Store,
    		appState,
    		onMount,
    		$appState
    	});

    	return [$appState];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
