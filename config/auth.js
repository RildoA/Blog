const  localStrategy = require("passport-local").Strategy //funciona com qualquer base de dados
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");

//MOdel usuario
require("../models/User");
const User = mongoose.model("usuarios");

module.exports = (passport)=>{
    //usernameField: é o campo que será analisado na autenticação
    //passwordField: especifica o campo em que estará a senha a ser auntenticado (se o valor do campo fosse 'password', seria reconhecido automaticamente)
    passport.use(new localStrategy({usernameField: 'email', passwordField: 'senha'},(email, senha, done)=>{

        User.findOne({email: email}).then((user)=>{
            if(!user){
                // done é uma função de callback que recebe parametros
                //1 - dadoa da conta autenticada
                //2 - estado da autenticalção
                //3 - mensagem
                return done(null, false, {message: "Esta conta não existe"});
            }
            bcrypt.compare(senha,user.senha, (erro, batem)=>{

                if(batem){
                    return done(null,user);
                }
                else{
                    return done(null, false, {message: "Senha incorrecta"})
                }

            })
        })

    }))


    passport.serializeUser((user,done)=>{
        done(null, user.id)
    })
    passport.deserializeUser((id, done)=>{
        User.findById(id).then((user)=>done(null,user)).catch((error)=>done(error))
       
    })
}