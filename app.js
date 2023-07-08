// Imports
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

dotenv.config();

mongoose.set("strictQuery",  true)

const app = express();
app.use(express.json())


app.use(cors())

// Models
const User = require("./src/models/User.ts")

// Principal Route
app.get("/", (req, res) => {
    res.send("Principal Route")
})

// AUTH ROUTES
app.post("/auth/register", async (req, res) => {
    
    const { username, email, password, confirmPassword } = req.body

    if (!username){
        return res.status(422).json({
            msg: "Nome de usuário é obrigatorio!"
        })
    }

    if (!email){
        return res.status(422).json({
            msg: "Email é obrigatorio!"
        })
    }

    if (!password){
        return res.status(422).json({
            msg: "A senha é obrigatoria!"
        })
    }

    if (!confirmPassword){
        return res.status(422).json({
            msg: "A confirmação da senha é obrigatoria!"
        })
    }

    const usernameExists = await User.findOne({ username: username})

    if (usernameExists) {
        return res.status(422).json({
            msg: "Nome de usuário ja utilizado"
        })
    }

    const emailExists = await User.findOne({ email: email})

    if (emailExists) {
        return res.status(422).json({
            msg: "Email ja utilizado"
        })
    }

    const checkPassword = password === confirmPassword

    if (!checkPassword) {
        return res.status(422).json({
            msg: "As senhas precisam ser iguais"
        })
    }


        const salt = await bcrypt.genSalt(12)
        const passwordHash = await bcrypt.hash(password, salt)

    const user = new User({
        username,
        email,
        password: passwordHash
    })

    try {

        await user.save()

        res.status(201).json({
            msg: "Usuário criado com sucesso!",
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Erro no servidor, tente novamente mais tarde!"
        })
    }

})

app.post("/auth", async (req, res) => {
    
    const { username, password } = req.body

    if (!username){
        return res.status(422).json({
            msg: "Nome de usuário é obrigatorio!"
        })
    }

    if (!password){
        return res.status(422).json({
            msg: "A senha é obrigatoria!"
        })
    }

    const usersExists = await User.findOne({ username: username })

    if (!usersExists) {
        return res.status(404).json({
            msg: "Usuário não existente!"
        })
    }

    const checkPassword = await bcrypt.compare(password, usersExists.password)

    if (!checkPassword) {
        return res.status(422).json({
            msg: "Senha incorreta!"
        })
    }

    try {
        res.status(200).json({
            msg: "Usuário autenticado",
            username,
        })

    } catch (error) {
        return res.status(500).json({
            msg: "Erro no servidor, tente novamente mais tarde!"
        })
    }

})

// USER routes
app.get("/users", async (req, res) => {
    
    try {
        const users = await User.find();
        return res.status(200).json({
            msg: "Usuarios listados com sucesso!",
            users
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Nao foi possivel encontrar a lista de usuarios!"
        })
    }
    
})

app.get("/users/details/:id", async (req, res) => {
    
    const { _id } = req.params;

    try {
        const user = await User.findOne(_id);
        return res.status(200).json({
            msg: "Usuarios encontrado com sucesso!",
            user
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Usuario nao encontrado!"
        })
    }
    
})

app.patch("/users/edit/:id", async (req, res) => {
    
    const { _id } = req.params;
    const { username, email } = req.body
    
    try {
        const editUser = await User.findOne(_id).then((user) => {
            user.username = username,
            user.email = email,

            user.save()
            }
        )
        return res.status(200).json({
            msg: "Usuarios encontrado com sucesso!",
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Usuario nao encontrado!"
        })
    }
    
})

app.delete("/users/delete/:id", async (req, res) => {
    const { _id } = req.params;

    try {
        const user = await User.findOne(_id);
        await User.remove(user);
        return res.status(200).json({
            msg: "Usuarios deletado com sucesso!",
            user
        })
    } catch (error) {
        return res.status(500).json({
            msg: "Nao foi possivel deletar o usuário, tentre novamente!"
        })
    }
})

// Connect DataBase
const dbUser = process.env.DB_USER
const dbPass = process.env.DB_PASS
const uri = `mongodb+srv://${dbUser}:${dbPass}@cluster0.mj7tdpn.mongodb.net/?retryWrites=true&w=majority`;

mongoose
    .connect(uri)
    .then(() => {
        app.listen(3333)
        console.log("Conectou ao Banco!")
    })
    .catch((err) => console.log(err))
