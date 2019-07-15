/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/WebAppBase/
 **/

const LEFT = false;
const RIGHT = !LEFT;
const IN = true;
const OUT = !IN;

function animate(v, parameters, callback = null) {
    let view = get(v);
    let removeStyles = () => {
        view.style.removeProperty("position");
        view.style.removeProperty("transitionDuration");
        view.style.removeProperty("transitionTimingFunction");
        view.style.removeProperty(parameters.name);
    };
    removeStyles();
    if (getComputedStyle(view).position === "static" || getComputedStyle(view).position === "sticky")
        view.style.position = "relative";
    view.style.transitionDuration = parameters.length + "s";
    view.style.transitionTimingFunction = "ease";
    view.style[parameters.name] = parameters.origin;
    setTimeout(() => {
        view.style[parameters.name] = parameters.destination;
        setTimeout(() => {
            if (!parameters.preserve) removeStyles();
            if (callback !== null) callback();
        }, parameters.length * 1000);
    }, 100 + parameters.delay * 1000);
}

function api(endpoint = null, api = null, action = null, parameters = null, callback = null, form = body()) {
    fetch(endpoint, {
        method: "post",
        body: body(api, action, parameters, form)
    }).then(response => {
        response.text().then((result) => {
            if (callback !== null && api !== null && action !== null) {
                let json = JSON.parse(result);
                if (json.hasOwnProperty(api)) {
                    if (json[api].hasOwnProperty("status") && json[api].hasOwnProperty("result")) {
                        if (json[api]["status"].hasOwnProperty(action) && json[api]["result"].hasOwnProperty(action)) {
                            let status = json[api]["status"][action];
                            let result = json[api]["result"][action];
                            if (status === true) {
                                callback(true, result, null);
                            } else {
                                callback(false, null, status);
                            }
                        }
                    } else {
                        callback(false, null, "Base API not detected in JSON");
                    }
                } else {
                    callback(false, null, "Base API (\"" + api + "\") not found in JSON");
                }
            }
        });
    });
}

function apply(configurations, target = null) {
    if (isObject(configurations)) {
        if (target === null) {
            for (let id in configurations) {
                if (configurations.hasOwnProperty(id) && exists(id)) apply(configurations[id], get(id));
            }
        } else {
            target = get(target);
            if (!isString(target)) {
                if (target !== null) {
                    for (let property in configurations) {
                        if (configurations.hasOwnProperty(property)) {
                            if (isObject(configurations[property])) {
                                if ((target.hasAttribute !== undefined && !target.hasAttribute(property)) || (target.hasAttribute === undefined && !target.hasOwnProperty(property))) target[property] = {};
                                apply(configurations[property], target[property]);
                            } else {
                                target[property] = configurations[property];
                            }
                        }
                    }
                }
            }
        }
    } else if (isArray(configurations)) {
        for (let c = 0; c < configurations.length; c++) {
            apply(configurations[c], target);
        }
    }
}

function body(api = null, action = null, parameters = null, form = new FormData()) {
    if (api !== null && action !== null && parameters !== null && !form.has(api)) {
        form.append(api, JSON.stringify({
            action: action,
            parameters: parameters
        }));
    }
    return form;
}

function clear(v) {
    let view = get(v);
    while (view.firstChild) {
        view.removeChild(view.firstChild);
    }
}

function download(file, data, type = "text/plain", encoding = "utf8") {
    let link = document.createElement("a");
    link.download = file;
    link.href = "data:" + type + ";" + encoding + "," + data;
    link.click();
}

function exists(v) {
    return get(v) !== undefined;
}

function get(v) {
    return isString(v) ? document.getElementById(v) : v;
}

function gestures(up = null, down = null, left = null, right = null, upgoing = null, downgoing = null, leftgoing = null, rightgoing = null) {
    let touchX, touchY, deltaX, deltaY;
    document.ontouchstart = (event) => {
        touchX = event.touches[0].clientX;
        touchY = event.touches[0].clientY;
    };
    document.ontouchmove = (event) => {
        deltaX = touchX - event.touches[0].clientX;
        deltaY = touchY - event.touches[0].clientY;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                if (leftgoing !== null) leftgoing();
            } else {
                if (rightgoing !== null) rightgoing();
            }
        } else {
            if (deltaY > 0) {
                if (upgoing !== null) upgoing();
            } else {
                if (downgoing !== null) downgoing();
            }
        }

    };
    document.ontouchend = () => {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                if (left !== null) left();
            } else {
                if (right !== null) right();
            }
        } else {
            if (deltaY > 0) {
                if (up !== null) up();
            } else {
                if (down !== null) down();
            }
        }
        touchX = null;
        touchY = null;
    };
}

function hide(v) {
    get(v).style.display = "none";
}

function html(callback = null) {
    fetch("layouts/template.html", {
        method: "get"
    }).then(response => {
        response.text().then((template) => {
            fetch("layouts/app.html", {
                method: "get"
            }).then(response => {
                response.text().then((app) => {
                    document.body.innerHTML = template.replace("<!--App Body-->", app);
                    if (callback !== null) callback();
                });
            });
        });
    });
}

function isArray(a) {
    return a instanceof Array;
}

function isObject(o) {
    return o instanceof Object && !isArray(o);
}

function isString(s) {
    return (typeof "" === typeof s || typeof '' === typeof s);
}

function make(type, content = null, configurations = null) {
    let made = document.createElement(type);
    if (content !== null) {
        if (!isString(content)) {
            made.appendChild(content);
        } else {
            made.innerText = content;
        }
    }
    if (configurations !== null) {
        apply(configurations, made);
    }
    return made;
}

function page(from, to, before = null, after = null) {
    transition(from, OUT, () => {
        if (before !== null) before();
        view(to);
        transition(to, IN, after);
    });
}

function show(v) {
    get(v).style.removeProperty("display");
}

function slide(v, motion = IN, direction = RIGHT, length = 0.2, delay = 0, callback = null) {
    let view = get(v);
    let style = getComputedStyle(view);
    let edge = (direction === RIGHT ? 1 : -1) * screen.width;
    let current = isNaN(parseInt(style.left)) ? 0 : parseInt(style.left);
    let origin = current === 0 && motion === IN ? edge : current;
    let destination = motion === IN ? 0 : edge;
    animate(view, {
        name: "left",
        origin: origin + "px",
        destination: destination + "px",
        length: length,
        delay: delay,
        preserve: true
    }, callback);
}

function theme(color) {
    let meta = document.getElementsByTagName("meta")["theme-color"];
    if (meta !== null) {
        meta.content = color;
    } else {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = color;
        document.head.appendChild(meta);
    }

}

function title(title) {
    document.title = title;
}

function transition(v, type = OUT, callback = null) {
    let element = get(v);
    for (let n = 0; n < element.children.length; n++) {
        slide(element.children[n], type, RIGHT, 0.4, 0.2 * n, n === element.children.length - 1 ? callback : null);
    }
}

function view(v) {
    let element = get(v);
    let parent = element.parentNode;
    for (let n = 0; n < parent.children.length; n++) {
        hide(parent.children[n]);
    }
    show(element);
}

function visible(v) {
    return (get(v).style.getPropertyValue("display") !== "none");
}

function worker(w = "worker.js") {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(w).then((result) => {
        });
    }
}