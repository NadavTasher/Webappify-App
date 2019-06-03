function load(loggedIn) {
    view("app");
    view("home");
}

function loadBuilder() {
    loadTemplates(() => {
        view("build");
        view("build-welcome");
    });
}