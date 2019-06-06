function view(v) {
    let element = get(v);
    let parent = element.parentNode;
    for (let n = 0; n < parent.children.length; n++) {
        hide(parent.children[n]);
    }
    show(element);
}

function hide(v) {
    get(v).style.display = "none";
}

function show(v) {
    get(v).style.removeProperty("display");
}

function get(v) {
    return (typeof "" === typeof v || typeof '' === typeof v) ? document.getElementById(v) : v;
}

function visible(v) {
    return (get(v).style.getPropertyValue("display") !== "none");
}

function clear(v) {
    let view = get(v);
    while (view.firstChild) {
        view.removeChild(view.firstChild);
    }
}

function exists(v) {
    return get(v) !== null;
}

function title(title) {
    document.title = title;
}

function theme(color) {
    let meta = document.getElementsByTagName("meta")["theme-color"];
    if (meta !== undefined) {
        meta.content = color;
    } else {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = color;
        document.head.appendChild(meta);
    }

}

function download(file, data, type = "text/plain", encoding = "utf8") {
    let link = document.createElement("a");
    link.download = file;
    link.href = "data:" + type + ";" + encoding + "," + data;
    link.click();
}

function slide(v, motion = true, direction = true, callback = undefined) {
    let offsets = {
        right: window.innerWidth - (get(v).getBoundingClientRect().right - get(v).offsetWidth),
        left: -(get(v).getBoundingClientRect().left + get(v).offsetWidth)
    };
    let offset = direction ? offsets.right : offsets.left;
    animate(v, (motion ? offset : 0) + "px", (!motion ? offset : 0) + "px", 1, "left", callback);
}

function animate(v, from, to, seconds, property, callback = undefined) {
    let view = get(v);
    view.style.removeProperty(property);
    view.style.position = "relative";
    view.style.animationTimingFunction = "linear";
    let fromFrame = {}, toFrame = {};
    fromFrame[property] = from;
    toFrame[property] = to;
    let animation = view.animate([fromFrame, toFrame], {duration: seconds * 1000});
    animation.onfinish = () => {
        view.style[property] = to;
        view.style.animationTimingFunction = null;
        if (callback !== undefined)
            callback();
    };
}

function gestures(up, down, left, right, upgoing, downgoing, leftgoing, rightgoing) {
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
                if (leftgoing !== undefined) leftgoing();
            } else {
                if (rightgoing !== undefined) rightgoing();
            }
        } else {
            if (deltaY > 0) {
                if (upgoing !== undefined) upgoing();
            } else {
                if (downgoing !== undefined) downgoing();
            }
        }

    };
    document.ontouchend = () => {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                if (left !== undefined) left();
            } else {
                if (right !== undefined) right();
            }
        } else {
            if (deltaY > 0) {
                if (up !== undefined) up();
            } else {
                if (down !== undefined) down();
            }
        }
        touchX = undefined;
        touchY = undefined;
    };
}

function worker(w = "worker.js") {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(w).then((result) => {
        });
    }
}

function html(callback = undefined) {
    fetch("layouts/template.html", {
        method: "get"
    }).then(response => {
        response.text().then((template) => {
            fetch("layouts/app.html", {
                method: "get"
            }).then(response => {
                response.text().then((app) => {
                    document.body.children[0].innerHTML = template.replace("<!--App Body-->", app);
                    if (callback !== undefined) callback();
                });
            });
        });
    });
}