/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/BaseTemplate/
 **/

/**
 * Base API for sending requests.
 */
class API {
    /**
     * Sends an API call.
     * @param api API to call
     * @param action API action
     * @param parameters API action parameters
     * @param callback API result callback
     * @param APIs API list for API layering
     */
    static send(api = null, action = null, parameters = null, callback = null, APIs = {}) {
        // Create a form
        let form = new FormData();
        // Append the compiled hook as "api"
        form.append("api", JSON.stringify(API.hook(api, action, parameters, APIs)));
        // Make sure the device is online
        if (window.navigator.onLine) {
            // Perform the request
            fetch("apis/" + api + "/", {
                method: "post",
                body: form
            }).then(response => {
                response.text().then((result) => {
                    // Make sure the callback exists and that the api and action aren't null
                    if (callback !== null && api !== null && action !== null) {
                        try {
                            // Try to parse the result as JSON
                            let json = JSON.parse(result);
                            try {
                                // Make sure the requested API exists in the result
                                if (api in json) {
                                    // Check the result's integrity
                                    if ("success" in json[api] && "result" in json[api]) {
                                        // Call the callback with the result
                                        callback(json[api]["success"] === true, json[api]["result"]);
                                    } else {
                                        // Call the callback with an error
                                        callback(false, "API parameters not found");
                                    }
                                } else {
                                    // Call the callback with an error
                                    callback(false, "API not found");
                                }
                            } catch (e) {
                            }
                        } catch (e) {
                            try {
                                // Call the callback with an error
                                callback(false, "API result isn't JSON");
                            } catch (e) {
                            }
                        }
                    }
                });
            });
        } else {
            // Call the callback with an error
            callback(false, "Offline");
        }
    }

    /**
     * Compiles an API call hook.
     * @param api The API to associate
     * @param action The action to be executed
     * @param parameters The parameters for the action
     * @param APIs The API parameters for the API call (for API layering)
     * @returns {FormData} API call hook
     */
    static hook(api = null, action = null, parameters = null, APIs = {}) {
        // Make sure the API isn't already compiled in the API list
        if (!(api in APIs)) {
            // Make sure none are null
            if (api !== null && action !== null && parameters !== null) {
                // Compile API
                APIs[api] = {
                    action: action,
                    parameters: parameters
                };
            }
        }
        // Return updated API list
        return APIs;
    }
}

/**
 * Base API for preparing the app.
 */
class App {
    /**
     * Prepares the web page (loads ServiceWorker, HTML).
     * @param callback Function to be executed when loading finishes
     */
    static prepare(callback = null) {
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
}

/**
 * Base API for creating the UI.
 */
class UI {
    /**
     * Animates a given view's property, while jumping from stop to stop every length amount of time.
     * @param v View
     * @param property View's style property to animate
     * @param stops Value stops
     * @param length Length of each animation stop
     * @param callback Function to run after animation is finished
     */
    static animate(v, property = "left", stops = ["0px", "0px"], length = 1000, callback = null) {
        // Store the view
        let view = UI.get(v);
        // Initialize the interval
        let interval = null;
        // Initialize a next function
        let next = () => {
            view.style[property] = stops[0];
            stops.splice(0, 1);
        };
        // Initialize a loop function
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
        // Call the next function
        next();
        // Start the interval
        interval = setInterval(loop, length);
        // Run the first loop
        setTimeout(() => {
            view.style.transitionDuration = length + "ms";
            view.style.transitionTimingFunction = "ease";
            loop();
        }, 0);
    }

    /**
     * Pops up a popup at the bottom of the screen.
     * @param contents The content to be displayed (View / Text)
     * @param timeout The time before the popup dismisses (0 - Forever, null - Default)
     * @param color The background color of the popup
     * @param onclick The click action for the popup (null - Dismiss)
     * @returns {function} Dismiss callback
     */
    static popup(contents, timeout = 3000, color = null, onclick = null) {
        // Initialize the popup's view
        let popupView = document.createElement("div");
        // Style the popup like a button
        UI.column(popupView);
        UI.input(popupView);
        // Create the dismiss function
        let dismiss = () => {
            if (popupView.parentElement !== null) {
                popupView.onclick = null;
                UI.animate(popupView, "opacity", ["1", "0"], 500, () => {
                    popupView.parentElement.removeChild(popupView);
                });
            }
        };
        // Add a click listener for the view
        popupView.addEventListener("click", (onclick !== null) ? onclick : dismiss);
        // Style the view
        popupView.style.position = "fixed";
        popupView.style.bottom = "0";
        popupView.style.left = "0";
        popupView.style.right = "0";
        popupView.style.margin = "1vh";
        popupView.style.height = "6vh";
        // Set background color if set
        if (color !== null)
            popupView.style.backgroundColor = color;
        // Set contents
        if (Utils.isString(contents)) {
            // Contents are text
            let text = document.createElement("p");
            text.innerText = contents;
            popupView.appendChild(text);
        } else {
            // Contents are views
            popupView.appendChild(contents);
        }
        // Fade in
        UI.animate(popupView, "opacity", ["0", "1"], 500, () => {
            if (timeout > 0) {
                setTimeout(() => {
                    dismiss();
                }, timeout);
            }
        });
        // Add to document
        document.body.appendChild(popupView);
        // Return dismiss function
        return dismiss;
    }

    /**
     * This function pops up installation instructions for Safari users.
     * @param title App's Name
     */
    static instruct(title = null) {
        // Check if the device is a mobilesafari browser
        let agent = window.navigator.userAgent.toLowerCase();
        let devices = ["iphone", "ipad", "ipod"];
        let safari = false;
        for (let i = 0; i < devices.length; i++) {
            if (agent.includes(devices[i])) safari = true;
        }
        // Only show is the device is on mobilesafari
        if (true || (safari && !("standalone" in window.navigator && window.navigator.standalone))) {
            // Initialize views
            let popupView = document.createElement("div");
            let text = document.createElement("p");
            let share = document.createElement("img");
            let then = document.createElement("p");
            let add = document.createElement("img");
            // Make the main view a row
            UI.row(popupView);
            // Set text for the text views
            text.innerText = "To add " + ((title === null) ? ("\"" + document.title + "\"") : title) + ", ";
            then.innerText = "then";
            // Set the src for the image views
            share.src = "resources/svg/icons/safari/share.svg";
            add.src = "resources/svg/icons/safari/add.svg";
            // Style the text views
            text.style.fontStyle = "italic";
            then.style.fontStyle = "italic";
            text.style.maxHeight = "5vh";
            then.style.maxHeight = "5vh";
            // Style the image views
            share.style.maxHeight = "4vh";
            add.style.maxHeight = "4vh";
            // Style all
            text.style.width = "auto";
            then.style.width = "auto";
            share.style.width = "auto";
            add.style.width = "auto";
            // Add to main view
            popupView.appendChild(text);
            popupView.appendChild(share);
            popupView.appendChild(then);
            popupView.appendChild(add);
            // Popup view
            UI.popup(popupView, 0, "#ffffffee");
        }
    }

    /**
     * Makes a given view a row.
     * @param v View
     */
    static row(v) {
        // Set attributes
        UI.get(v).setAttribute("row", "true");
        UI.get(v).setAttribute("column", "false");
    }

    /**
     * Makes a given view a column.
     * @param v View
     */
    static column(v) {
        // Set attributes
        UI.get(v).setAttribute("column", "true");
        UI.get(v).setAttribute("row", "false");
    }

    /**
     * Makes a given view an input.
     * @param v View
     */
    static input(v) {
        // Set attribute
        UI.get(v).setAttribute("input", "true");
    }

    /**
     * Makes a given view a text.
     * @param v View
     */
    static text(v) {
        // Set attribute
        UI.get(v).setAttribute("text", "true");
    }

    /**
     * Removes all children of a given view.
     * @param v View
     */
    static clear(v) {
        // Store view
        let view = UI.get(v);
        // Remove all views
        while (view.firstChild) {
            view.removeChild(view.firstChild);
        }
    }

    /**
     * Returns a view by its ID or by it's own value.
     * @param v View
     * @returns {HTMLElement} View
     */
    static get(v) {
        // Return requested view
        return Utils.isString(v) ? document.getElementById(v) : v;
    }

    /**
     * Hides a given view.
     * @param v View
     */
    static hide(v) {
        // Set style to none
        UI.get(v).style.display = "none";
    }

    /**
     * Shows a given view.
     * @param v View
     */
    static show(v) {
        // Set style to original value
        UI.get(v).style.removeProperty("display");
    }

    /**
     * Shows a given view while hiding it's brothers.
     * @param v View
     */
    static view(v) {
        // Store view
        let element = UI.get(v);
        // Store parent
        let parent = element.parentNode;
        // Hide all
        for (let child of parent.children) {
            UI.hide(child);
        }
        // Show view
        UI.show(element);
    }

    /**
     * Sets a given target as the only visible part of the page.
     * @param target View
     */
    static page(target) {
        // Store current target
        let temporary = UI.get(target);
        // Recursively get parent
        while (temporary.parentNode !== document.body && temporary.parentNode !== document.body) {
            // View temporary
            UI.view(temporary);
            // Set temporary to it's parent
            temporary = temporary.parentNode;
        }
        // View temporary
        UI.view(temporary);
    }

    /**
     * Returns whether a view is visible.
     * @param v View
     * @returns {boolean} Visible
     */
    static isVisible(v) {
        // Return visibility state
        return (UI.get(v).style.getPropertyValue("display") !== "none");
    }
}

/**
 * Base API for device information.
 */
class Device {
    /**
     * Returns whether the device is a mobile phone.
     * @returns {boolean} Is mobile
     */
    static isMobile() {
        // Check if the height is larger than the width
        return window.innerHeight > window.innerWidth;
    }

    /**
     * Returns whether the device is a desktop.
     * @returns {boolean} Is desktop
     */
    static isDesktop() {
        // Check if the device is not mobile
        return !Device.isMobile();
    }
}

/**
 * Base API for general tools.
 */
class Utils {
    /**
     * Returns whether the given parameter is an array.
     * @param a Parameter
     * @returns {boolean} Is an array
     */
    static isArray(a) {
        return a instanceof Array;
    }

    /**
     * Returns whether the given parameter is an object.
     * @param o Parameter
     * @returns {boolean} Is an object
     */
    static isObject(o) {
        return o instanceof Object && !Utils.isArray(o);
    }

    /**
     * Returns whether the given parameter is a string.
     * @param s Parameter
     * @returns {boolean} Is a string
     */
    static isString(s) {
        return (typeof "" === typeof s || typeof '' === typeof s);
    }
}