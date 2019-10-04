/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/WebAppBase/
 **/

/* API */

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

function body(api = null, action = null, parameters = null, form = new FormData()) {
    if (api !== null && action !== null && parameters !== null && !form.has(api)) {
        form.append(api, JSON.stringify({
            action: action,
            parameters: parameters
        }));
    }
    return form;
}

function instruct(title = null) {
    let agent = window.navigator.userAgent.toLowerCase();
    let devices = ["iphone", "ipad", "ipod"];
    let safari = false;
    for (let i = 0; i < devices.length; i++) {
        if (agent.includes(devices[i])) safari = true;
    }
    if ((safari && !(window.navigator.hasOwnProperty("standalone") && window.navigator.standalone)) || !safaricheck) {
        let div = make("div");
        let text = make("p");
        let share = make("img");
        let then = make("p");
        let add = make("img");
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
        popup(div, "#ffffffee", 0);
    }
}

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

function clear(v) {
    let view = get(v);
    while (view.firstChild) {
        view.removeChild(view.firstChild);
    }
}

function exists(v) {
    return get(v) !== undefined;
}

function get(v) {
    return isString(v) ? document.getElementById(v) : v;
}

function hide(v) {
    get(v).style.display = "none";
}

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

function page(target) {
    let temporary = get(target);
    while (temporary.parentNode !== document.body && temporary.parentNode !== document.body) {
        view(temporary);
        temporary = temporary.parentNode;
    }
    view(temporary);
}

function show(v) {
    get(v).style.removeProperty("display");
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

/* Animations */

const LEFT = false;
const RIGHT = !LEFT;
const IN = true;
const OUT = !IN;

function animate(v, property = "left", stops = ["0px", "0px"], length = 1, callback = null) {
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
    interval = setInterval(loop, length * 1000);
    setTimeout(() => {
        view.style.transitionDuration = length + "s";
        view.style.transitionTimingFunction = "ease";
        loop();
    }, 0);
}

function slide(v, motion = IN, direction = RIGHT, length = 0.2, callback = null) {
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

function column(v) {
    get(v).setAttribute("column", true);
    get(v).setAttribute("row", false);
}

function input(v) {
    get(v).setAttribute("input", true);
}

function row(v) {
    get(v).setAttribute("row", true);
    get(v).setAttribute("column", false);
}

function text(v) {
    get(v).setAttribute("text", true);
}

/* Interface */

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

function popup(contents, timeout = null, color = null, onclick = null) {
    let div = make("div");
    column(div);
    input(div);
    let dismiss = () => {
        if (div.parentElement !== null) {
            div.onclick = null;
            animate(div, "opacity", ["1", "0"], 0.5, () => {
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
    animate(div, "opacity", ["0", "1"], 0.5, () => {
        if (timeout !== null && timeout > 0) {
            setTimeout(() => {
                dismiss();
            }, timeout);
        }
    });
    document.body.appendChild(div);
    return dismiss;
}

/* Utils */

function isArray(a) {
    return a instanceof Array;
}

function isObject(o) {
    return o instanceof Object && !isArray(o);
}

function isString(s) {
    return (typeof "" === typeof s || typeof '' === typeof s);
}

function open(callback = null, read = false) {
    let selector = make("input");
    selector.type = "file";
    selector.style.display = "none";
    document.body.appendChild(selector);
    selector.oninput = () => {
        selector.parentElement.removeChild(selector);
        if (selector.files.length > 0) {
            let file = selector.files[0];
            if (callback !== null) {
                if (read) {
                    let reader = new FileReader();
                    reader.onload = (result) => {
                        callback(file, result.target.result);
                    };
                    reader.readAsText(file);
                } else {
                    callback(file, null);
                }
            }


        }
    };
    selector.click();
}

function save(file, data, type = "text/plain", encoding = "utf8") {
    let link = document.createElement("a");
    link.download = file;
    link.href = "data:" + type + ";" + encoding + "," + data;
    link.click();
}