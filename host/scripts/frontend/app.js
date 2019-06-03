function load(loggedIn) {
    if (loggedIn) {
        view("app");
        view("introduction");
    }else{
        window.location.href = "../home";
    }
}