const formLogin =
    document.getElementById(
        "formLogin"
    );


const email =
    document.getElementById(
        "email"
    );


const password =
    document.getElementById(
        "password"
    );


const mensaje =
    document.getElementById(
        "mensaje"
    );


const btnEntrar =
    document.getElementById(
        "btnEntrar"
    );



async function verificarSesion() {

    const {
        data
    } =
        await supabaseClient.auth.getSession();


    if (
        data.session
    ) {

        window.location.href =
            "index.html";

    }

}



formLogin.addEventListener(
    "submit",

    async function(event) {

        event.preventDefault();


        mensaje.textContent =
            "";


        mensaje.className =
            "";


        btnEntrar.disabled =
            true;


        btnEntrar.textContent =
            "Ingresando...";


        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({

                    email:
                        email.value.trim(),

                    password:
                        password.value

                });


        if (error) {

            mensaje.textContent =
                "Correo o contraseña incorrectos.";

            mensaje.className =
                "error";


            btnEntrar.disabled =
                false;


            btnEntrar.textContent =
                "Iniciar sesión";


            return;

        }


        if (
            data.user
        ) {

            mensaje.textContent =
                "Acceso correcto.";

            mensaje.className =
                "correcto";


            setTimeout(
                function() {

                    window.location.href =
                        "index.html";

                },
                500
            );

        }

    }
);



verificarSesion();