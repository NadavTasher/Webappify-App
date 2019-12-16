/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/BaseTemplate/
 **/

/* API */

/**
 * This function is responsible for API calls between the frontend and the backend.
 * @param endpoint The backend PHP file to be reached
 * @param api The API which this call associates with
 * @param action The action to be executed
 * @param parameters The parameters for the action
 * @param callback The callback for the API call, contains success, result and error
 * @param APIs The API parameters for the API call (for API layering)
 */
function api(endpoint = null, api = null, action = null, parameters = null, callback = null, APIs = {}) {
    let form = new FormData();
    form.append("api", JSON.stringify(hook(api, action, parameters, APIs)));
    if (window.navigator.onLine) {
        fetch(endpoint, {
            method: "post",
            body: form
        }).then(response => {
            response.text().then((result) => {
                if (callback !== null && api !== null && action !== null) {
                    try {
                        let json = JSON.parse(result);
                        try {
                            if (api in json) {
                                if ("success" in json[api] && "result" in json[api]) {
                                    callback(json[api]["success"] === true, json[api]["result"]);
                                } else {
                                    callback(false, "API parameters not found");
                                }
                            } else {
                                callback(false, "API not found");
                            }
                        } catch (e) {
                        }
                    } catch (e) {
                        try {
                            callback(false, "API result isn't JSON");
                        } catch (e) {
                        }
                    }
                }
            });
        });
    } else {
        callback(false, "Offline");
    }
}

/**
 * This function compiles the API call hook.
 * @param api The API to associate
 * @param action The action to be executed
 * @param parameters The parameters for the action
 * @param APIs The API parameters for the API call (for API layering)
 * @returns {FormData} API call hook
 */
function hook(api = null, action = null, parameters = null, APIs = {}) {
    if (!(api in APIs)) {
        if (api !== null && action !== null && parameters !== null) {
            APIs[api] = {
                action: action,
                parameters: parameters
            };
        }
    }
    return APIs;
}

/**
 * This function pops up installation instructions for Safari users.
 * @param title App's Name
 */
function instruct(title = null) {
    let agent = window.navigator.userAgent.toLowerCase();
    let devices = ["iphone", "ipad", "ipod"];
    let safari = false;
    for (let i = 0; i < devices.length; i++) {
        if (agent.includes(devices[i])) safari = true;
    }
    if ((safari && !("standalone" in window.navigator && window.navigator.standalone))) {
        let div = make("div");
        let text = make("p");
        let share = make("img");
        let then = make("p");
        let add = make("img");
        row(div);
        text.innerText = "To add " + ((title === null) ? ("\"" + document.title + "\"") : title) + ", ";
        share.src = "resources/svg/icons/safari/share.svg";
        then.innerText = "then";
        add.src = "resources/svg/icons/safari/add.svg";
        text.style.fontStyle = "italic";
        then.style.fontStyle = "italic";
        text.style.maxHeight = "5vh";
        share.style.maxHeight = "4vh";
        then.style.maxHeight = "5vh";
        add.style.maxHeight = "4vh";
        div.appendChild(text);
        div.appendChild(share);
        div.appendChild(then);
        div.appendChild(add);
        popup(div, 0, "#ffffffee");
    }
}

/**
 * This function prepares the web page (loads ServiceWorker, HTML).
 * @param callback Function to be executed when loading finishes
 */
function prepare(callback = null) {
    // Register worker
    if ("serviceWorker" in navigator)
        navigator.serviceWorker.register("worker.js").then();
    // Load layouts
    fetch("layouts/template.html", {
        method: "get"
    }).then(response => {
        response.text().then((template) => {
            fetch("layouts/app.html", {
                method: "get"
            }).then(response => {
                response.text().then((app) => {
                    document.body.innerHTML = template.replace("<!--App Body-->", app);
                    if (callback !== null)
                        callback()
                });
            });
        });
    });
}

/* Visuals */

/**
 * This function removes all children of given view.
 * @param v View
 */
function clear(v) {
    let view = get(v);
    while (view.firstChild) {
        view.removeChild(view.firstChild);
    }
}

/**
 * This function returns the view by its ID or by it's own value.
 * @param v View
 * @returns {HTMLElement} View
 */
function get(v) {
    return isString(v) ? document.getElementById(v) : v;
}

/**
 * This function hides the given view.
 * @param v View
 */
function hide(v) {
    get(v).style.display = "none";
}

/**
 * This function creates a new view by its type, contents and classes.
 * @param type View type
 * @param content View contents
 * @param classes View classes
 * @returns {HTMLElement} View
 */
function make(type, content = null, classes = []) {
    let made = document.createElement(type);
    if (content !== null) {
        if (!isString(content)) {
            if (isArray(content)) {
                for (let i = 0; i < content.length; i++) {
                    made.appendChild(content[i]);
                }
            } else {
                made.appendChild(content);
            }
        } else {
            made.innerText = content;
        }
    }
    for (let c = 0; c < classes.length; c++)
        made.classList.add(classes[c]);
    return made;
}

/**
 * This function recursively sets the viewed view to be the given view.
 * @param target View
 */
function page(target) {
    let temporary = get(target);
    while (temporary.parentNode !== document.body && temporary.parentNode !== document.body) {
        view(temporary);
        temporary = temporary.parentNode;
    }
    view(temporary);
}

/**
 * This function shows the given view.
 * @param v View
 */
function show(v) {
    get(v).style.removeProperty("display");
}

/**
 * This function shows the given view while hiding it's brothers.
 * @param v View
 */
function view(v) {
    let element = get(v);
    let parent = element.parentNode;
    for (let n = 0; n < parent.children.length; n++) {
        hide(parent.children[n]);
    }
    show(element);
}

/**
 * This function returns the visibillity state of the given view.
 * @param v View
 * @returns {boolean} Visible
 */
function visible(v) {
    return (get(v).style.getPropertyValue("display") !== "none");
}

/* Animations */

const LEFT = false;
const RIGHT = !LEFT;
const IN = true;
const OUT = !IN;

/**
 * This function animates the given view's property, while jumping from stop to stop every length amount of time.
 * @param v View
 * @param property View's style property to animate
 * @param stops Value stops
 * @param length Length of each animation stop
 * @param callback Function to run after animation is finished
 */
function animate(v, property = "left", stops = ["0px", "0px"], length = 1000, callback = null) {
    let view = get(v);
    let interval = null;
    let next = () => {
        view.style[property] = stops[0];
        stops.splice(0, 1);
    };
    let loop = () => {
        if (stops.length > 0) {
            next();
        } else {
            clearInterval(interval);
            view.style.removeProperty("transitionDuration");
            view.style.removeProperty("transitionTimingFunction");
            if (callback !== null) callback();
        }
    };
    next();
    interval = setInterval(loop, length);
    setTimeout(() => {
        view.style.transitionDuration = length + "ms";
        view.style.transitionTimingFunction = "ease";
        loop();
    }, 0);
}

/**
 * This function slides the given view in or out of frame with given direction.
 * @param v View
 * @param motion Type of motion (In / Out)
 * @param direction Direction of motion (Left / Right)
 * @param length Length of animation
 * @param callback Function to run after animation is finished
 */
function slide(v, motion = IN, direction = RIGHT, length = 200, callback = null) {
    let view = get(v);
    let style = getComputedStyle(view);
    let edge = (direction === RIGHT ? 1 : -1) * screen.width;
    let current = isNaN(parseInt(style.left)) ? 0 : parseInt(style.left);
    let origin = current === 0 && motion === IN ? edge : current;
    let destination = motion === IN ? 0 : edge;
    if (getComputedStyle(view).position === "static" ||
        getComputedStyle(view).position === "sticky")
        view.style.position = "relative";
    animate(view, "left", [origin + "px", destination + "px"], length, callback);
}

/* Attributes */

/**
 * This function makes the given view a column.
 * @param v View
 */
function column(v) {
    get(v).setAttribute("column", "true");
    get(v).setAttribute("row", "false");
}

/**
 * This function makes the given view an input.
 * @param v View
 */
function input(v) {
    get(v).setAttribute("input", "true");
}

/**
 * This function makes the given view a row.
 * @param v View
 */
function row(v) {
    get(v).setAttribute("row", "true");
    get(v).setAttribute("column", "false");
}

/**
 * This function makes the given view a text.
 * @param v View
 */
function text(v) {
    get(v).setAttribute("text", "true");
}

/* Interface */

/**
 * This function pops up a popup at the bottom of the screen.
 * @param contents The content to be displayed (View / Text)
 * @param timeout The time before the popup dismisses (0 - Forever, null - Default)
 * @param color The background color of the popup
 * @param onclick The click action for the popup (null - Dismiss)
 * @returns {function} Dismiss callback
 */
function popup(contents, timeout = 3000, color = null, onclick = null) {
    let div = make("div");
    column(div);
    input(div);
    let dismiss = () => {
        if (div.parentElement !== null) {
            div.onclick = null;
            animate(div, "opacity", ["1", "0"], 500, () => {
                div.parentElement.removeChild(div);
            });
        }
    };
    div.onclick = (onclick !== null) ? onclick : dismiss;
    div.style.position = "fixed";
    div.style.bottom = "0";
    div.style.left = "0";
    div.style.right = "0";
    div.style.margin = "1vh";
    div.style.padding = "1vh";
    div.style.height = "6vh";
    if (color !== null)
        div.style.backgroundColor = color;
    if (isString(contents)) {
        div.appendChild(make("p", contents));
    } else {
        div.appendChild(contents);
    }
    animate(div, "opacity", ["0", "1"], 500, () => {
        if (timeout > 0) {
            setTimeout(() => {
                dismiss();
            }, timeout);
        }
    });
    document.body.appendChild(div);
    return dismiss;
}

/* Utils */

/**
 * This function returns whether the given parameter is an array.
 * @param a Parameter
 * @returns {boolean} Is an array
 */
function isArray(a) {
    return a instanceof Array;
}

/**
 * This function returns whether the given parameter is an object.
 * @param o Parameter
 * @returns {boolean} Is an object
 */
function isObject(o) {
    return o instanceof Object && !isArray(o);
}

/**
 * This function returns whether the given parameter is a string.
 * @param s Parameter
 * @returns {boolean} Is a string
 */
function isString(s) {
    return (typeof "" === typeof s || typeof '' === typeof s);
}

/**
 * This function returns whether the device is a mobile phone
 * @returns {boolean} Is mobile
 */
function isMobile() {
    return window.innerHeight > window.innerWidth;
}

/**
 * This function return whether the device is a desktop.
 * @returns {boolean} Is desktop
 */
function isDesktop() {
    return !isMobile();
}