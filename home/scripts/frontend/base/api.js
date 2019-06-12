/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/WebAppBase/
 **/

function animate(v, from, to, seconds, property, keep = false, callback = null) {
    let view = get(v);
    view.removeAttribute("style");
    let position = getComputedStyle(view).position;
    if (position === "static" || position === "sticky") {
        view.style.position = "relative";
    }
    try {
        view.animate([{[property]: from}, {[property]: to}], {
            duration: seconds * 1000,
            fill: keep ? "forwards" : "backwards",
            easing: "linear"
        }).onfinish = () => {
            if (callback !== null) callback();
        };
    } catch (e) {
        if (callback !== null) callback();
    }

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
    return (typeof "" === typeof v || typeof '' === typeof v) ? document.getElementById(v) : v;
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
                    document.body.children[0].innerHTML = template.replace("<!--App Body-->", app);
                    if (callback !== null) callback();
                });
            });
        });
    });
}

function show(v) {
    get(v).style.removeProperty("display");
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

function slide(v, motion = true, direction = true, callback = null) {
    let offsets = {
        right: window.innerWidth - (get(v).getBoundingClientRect().right - get(v).offsetWidth),
        left: -(get(v).getBoundingClientRect().left + get(v).offsetWidth)
    };
    let offset = direction ? offsets.right : offsets.left;
    animate(v, (motion ? offset : 0) + "px", (!motion ? offset : 0) + "px", 0.2, "left", false, callback);
}

function worker(w = "worker.js") {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(w).then((result) => {
        });
    }
}