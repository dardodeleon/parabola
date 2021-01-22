var App = {

    const: {
        rate: {
            def: 1.0,
            key: 'rate',
            options: {
                r0_5: {
                    title: 'Rate 0.5',
                    value: 0.5
                },
                r1: {
                    title: 'Rate 1',
                    value: 1.0
                },
                r1_5: {
                    title: 'Rate 1.5',
                    value: 1.5
                },
                r1_8: {
                    title: 'Rate 1.8',
                    value: 1.8
                },
                r2: {
                    title: 'Rate 2',
                    value: 2.0
                },
                r2_5: {
                    title: 'Rate 2.5',
                    value: 2.5
                }
            }
        },
        voice: {
            def: '',
            key: 'voice'
        },
        filter: {
            def: '',
            key: 'filter'
        }
    },

    vars: {
        currentState: {
            rate: null,
            voice: null,
            filter: ''
        },
        notSupported: 'Plugin not available for this browser.',
    },

    plugin: {
        menu: {
            options: {
                items: [{
                        title: 'Reed',
                        contexts: ['selection'],
                        onclick: (info, tab, option) => App.read.toggle((info && info.selectionText && info.selectionText.length > 0) ? info.selectionText : '')
                    },
                    {
                        title: 'Stop reading',
                        contexts: ['page'],
                        onclick: (info, tab, option) => App.read.toggle('')
                    },
                    {
                        type: 'separator',
                        contexts: ['page']
                    },
                    {
                        title: 'r1',
                        type: 'radio',
                        checked: false, 
                        contexts: ['page']
                    },
                    {
                        title: 'r1_5',
                        type: 'radio',
                        checked: false, 
                        contexts: ['page']
                    },
                    {
                        title: 'r1_8',
                        type: 'radio',
                        checked: false, 
                        contexts: ['page']
                    },
                    {
                        title: 'r2',
                        type: 'radio',
                        checked: false, 
                        contexts: ['page']
                    },
                    {
                        title: 'r2_5',
                        type: 'radio',
                        checked: false, 
                        contexts: ['page']
                    },
                    {
                        type: 'separator',
                        contexts: ['page']
                    },
                    {
                        title: 'Options',
                        contexts: ['page'], 
                        onclick: (info, tab, option) => App.browser.getTabs().create({ url: 'core/config.html' })
                    }
                ],
                create: (opt, rate, config) => {
                    let option = Object.assign({}, opt);

                    if (typeof config === typeof {}) {
                        option.title = config.title;
                        option.checked = config.value === rate;
                        option.onclick = (info, tab, option) => App.data.put(App.const.rate.key, config.value);
                    }

                    return option;
                }
            },
            notSupported: {
                title: 'Not available',
                contexts: ['page'],
                onclick: () => alert(App.vars.notSupported)
            }
        }
    },

    ui: {
        elements: {
            app: null,
            rates: null,
            voices: null,
            filter: null,
            text: null,
            test: null,
            save: null
        },
        options: {
            rate: [],
            voice: [],
            create: (doc, title, key, value) => {
                var ele = doc.createElement('li');

                ele.className = 'item';
                ele.innerHTML = title;
                ele.dataset.key = key;
                ele.dataset.value = value;

                App.ui.options[key].push(ele);

                return ele;
            },
        },
        update: () => {
            Object.keys(App.const).forEach(key => {
                if (Array.isArray(App.ui.options[key])) {
                    let currentValue = (App.vars.currentState[key]) ? App.vars.currentState[key] : '';

                    App.ui.options[key].forEach(opt => {
                        opt.dataset.selected = opt.dataset.value === currentValue;

                        opt.className = (App.vars.currentState.filter.trim().length > 0 && opt.dataset.value.toLowerCase().indexOf(App.vars.currentState.filter.toLowerCase()) === -1)
                            ? 'item item-hide' 
                            : 'item';
                    });
                }
            });
        },
        onclick: (e) => {
            var target = (e.target || e.srcElement);

            if (target.dataset.value && App.vars.currentState.hasOwnProperty(target.dataset.key)) {
                // update status without storing changes
                App.vars.currentState[target.dataset.key] = target.dataset.value;

                App.ui.update();
            } else if (target.dataset.action === 'test') {
                // testing
                App.read.stop(() => App.read.read(App.ui.elements.text.value, App.vars.currentState[App.const.rate.key], App.vars.currentState[App.const.voice.key]));
            } else if (target.dataset.action === 'save') {
                // prepare and store changes
                for (let key in App.vars.currentState) {
                    App.data.put(key, App.vars.currentState[key]);
                }

                // reload menu
                App.bootstrap.plugin();
            }
        },
        onkeyup: (e) => {
            var target = (e.target || e.srcElement);

            if (App.vars.currentState.hasOwnProperty(target.dataset.key)) {

                if (target.dataset.key === App.const.filter.key) {
                    App.data.put(target.dataset.key, target.value);
                }

                App.vars.currentState[target.dataset.key] = target.value;

                App.ui.update();
            }            
        }
    },

    bootstrap: {
        config: (win, doc) => {

            // retrieves current state of data
            for (let key in App.vars.currentState) {
                App.data.get(key, (result) => { 
                    App.vars.currentState[key] = result[key] || App.const[key].def;

                    // set language filter
                    if (key === App.const.filter.key) {
                        App.ui.elements.filter.value = App.vars.currentState.filter;
                    }
                });
            }

            // load UI elements
            for (let id in App.ui.elements) {
                App.ui.elements[id] = doc.getElementById(id);
            }

            // event handling click|keyup 
            App.ui.elements.app.addEventListener('click', App.ui.onclick);
            App.ui.elements.app.addEventListener('keyup', App.ui.onkeyup);

            // options rate
            for (let o of Object.keys(App.const.rate.options)) {
                App.ui.elements.rates.appendChild(
                    App.ui.options.create(doc, App.const.rate.options[o].value, App.const.rate.key, App.const.rate.options[o].value)
                );
            }

            // options voice
            let voiceLoader = win.setInterval(() => {
                let voices = win.speechSynthesis.getVoices();

                if (Array.isArray(voices) && voices.length > 0) {

                    win.clearInterval(voiceLoader);

                    for (let voice of voices) {
                        App.ui.elements.voices.appendChild(
                            App.ui.options.create(doc, voice.name, App.const.voice.key, voice.name)
                        );
                    }

                    App.ui.update();
                }
            }, 100);
        },
        plugin: () => {

            const menu = App.browser.getMenu();

            menu.removeAll(() => {
                if (App.read.support()) {
                    App.data.get(App.const.rate.key, (resultRate) => {
                        var currentRate = resultRate && resultRate[App.const.rate.key] || App.const.rate.def;

                        for (let option of App.plugin.menu.options.items) {
                            menu.create(App.plugin.menu.options.create(option, currentRate, App.const.rate.options[option.title]));
                        }
                    });
                } else {
                    menu.create(App.plugin.menu.notSupported);
                }
            });
        }
    },

    data: {
        values: {},
        get: (k, callback) => {
            if (typeof callback === typeof Function) {
                App.browser.getStorage().get([k], callback);
            }
        },
        set: (k, v) => {
            App.data.values[k] = v;
        },
        save: (callback) => {
            App.browser.getStorage().set(App.data.values, callback)
        },
        put: (k, v) => {
            App.data.set(k, v);
            App.data.save(() => console.log(`Put saved: ${JSON.stringify(App.data.values)}`));
        }
    },

    read: {
        support: () => {
            var typeObj = typeof {};
            var typeFun = typeof Function;

            return typeof window === typeObj &&
                typeof window.speechSynthesis === typeObj &&
                typeof window.speechSynthesis.speak === typeFun &&
                typeof window.SpeechSynthesisUtterance === typeFun;
        },
        toggle: (text) => {
            App.data.get(App.const.rate.key, (rate) => {
                App.data.get(App.const.voice.key, (voice) => {
                    let cRate = rate[App.const.rate.key] || App.const.rate.def;
                    let cVoice = voice[App.const.voice.key] || App.const.rate.def;

                    App.read.stop(() => App.read.read(text, cRate, cVoice));
                });
            });
        },
        read: (text, rate, voiceName) => {
            if (App.read.support()) {                
                if (text.trim() !== '') {

                    var ssu = new SpeechSynthesisUtterance(text);
                    /**
                     * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/text
                     * @type string
                     */
                    ssu.text = text;
                    /**
                     * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/rate
                     * @type float: 0,1(min) ... 1(def) ... 2 ... 10(max)
                     */
                    ssu.rate = rate;
                    /**
                     * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/pitch
                     * @type float: 0(min) ... 1(def) ... 2(max)
                     */
                    ssu.pitch = 1.0;
                    /**
                     * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/volume
                     * @type float: 0(min) ... 1(max)
                     */
                    ssu.volume = 1.0;
                    /**
                     * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/voice
                     * @type SpeechSynthesisVoice
                     */
                    var voice = speechSynthesis.getVoices().find((v) => v.name == voiceName);
                    if (typeof voice === typeof {}) {
                        ssu.voice = voice;
                    }

                    window.speechSynthesis.speak(ssu);
                }
            } else {
                alert(App.vars.notSupported);
            }
        },
        stop: (callback) => {
            window.speechSynthesis.cancel();

            window.setTimeout(callback, 500);
        }
    },

    browser: {
        getTabs: () => { throw new Error('App.browser.getTabs() is not defined') },
        getMenu: () => { throw new Error('App.browser.getMenu() is not defined') },
        getStorage: () => { throw new Error('App.browser.getStorage() is not defined') }
    }
};
