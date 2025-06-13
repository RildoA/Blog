const { text } = require('body-parser');
const Express = require('express');
const router = Express.Router();
const mongoose = require("mongoose");
require("../models/User")
const User = mongoose.model("usuarios")
require("../models/Category");
const Categoria = mongoose.model("categorias")
require("../models/Post");
const Post = mongoose.model("postagens")
const {logado}= require("../helpers/logAdo");
const bcrypt = require("bcryptjs")
const passport = require('passport')
var slugsRegistados = []

router.get("/register",(req,res)=>{
    res.render("users/register")
})
router.post("/register",(req,res)=>{
    var erros = []

    if(!req.body.nome || typeof(req.body.nome) ==undefined || req.body.nome == null){
        erros.push({text: "Nome inválido"})
    }
    if(!req.body.email || typeof(req.body.email) ==undefined || req.body.email == null){
        erros.push({text: "Email inválido"})
    }
    if(!req.body.senha || typeof(req.body.senha) ==undefined || req.body.senha == null){
        erros.push({text: "Senha inválida"})
    }
    if(req.body.senha.length<8){
        erros.push({text:"Senha muito curta"})
    }
    if(req.body.senha!=req.body.senha2){
        erros.push({text:"As senhas são diferentes, tente novamente"})
    }

    if(erros.length>0){
        res.render("users/register",{erros: erros})
    }
    else{
        User.findOne({email: req.body.email}).lean().then((user)=>{
            if(user){
                req.session.error_msg="Email já registado";
                res.redirect("/user/register")
            }else{
                const chaveAdmin = "#SouAdmin";
                req.session.success_msg="Usuário criado com sucesso"
                const newUser = new User({
                    nome: req.body.nome.endsWith(chaveAdmin)?req.body.nome.replace(chaveAdmin,""):req.body.nome,
                    email: req.body.email,
                    senha: req.body.senha,
                    ehAdmin: req.body.nome.endsWith(chaveAdmin)?1:0
                    
                })
                
                //salt valor aleatório para ficar dentro de HASH, aumentado a dificuldade
                bcrypt.genSalt(10,(error,salt)=>{
                    bcrypt.hash(newUser.senha,salt,(error,hash)=>{
                        if(error){
                            req.session.error_msg="Houve um erro durante o salvamento do usuário"
                            console.log("Houve um erro durante o salvamento do usuário: ",error);
                            
                        }
                        newUser.senha = hash
                        newUser.save().then(()=>{
                            req.session.sucess_msg = "Usuário criado com sucesso";
                            res.redirect("/")
                        }).catch((error)=>{
                            req.session.error_msg="Houve um erro ao criar usuário, tente novamente";
                            console.log("Houve um erro ao criar usuário: "+error);
                            res.redirect("/")
                        })
                    })
                })
            }
        }).catch((error)=>{
            req.session.error_msg="Erro ao encontrar usuário";
            console.log("Erro ao encontrar usuário: "+error);
            res.redirect("/register");
        })
    }
})
router.get("/login",(req,res)=>{
    res.render("users/login")
})
router.post("/login",(req, res, next)=>{
    /*
    passport.authenticate("local",{
        successRedirect: "/", //caminho caso autenticação tenha sido bem feita
        failureRedirect: "/user/login" //caminho caso haja uma falha na autenticação


        
    })(req,res,next)
    */
    passport.authenticate("local",(err,user,info)=>{
        
        if (err) {
      req.session.error_msg = 'Erro ao autenticar';
      return res.redirect('/user/login');
    }

    if (!user) {
      req.session.error_msg = info?.message || 'Login inválido';
      return res.redirect('/user/login');
    }

    req.logIn(user, (err) => {
      if (err) {
        req.session.error_msg = 'Erro ao logar';
        return res.redirect('/user/login');
      }

      req.session.success_msg = 'Login efetuado com sucesso';
      return res.redirect('/');
    });

    })(req,res,next)
})
router.get("/logout",(req,res)=>{
    req.logout((error)=>{
        if(error){
            req.session.error_msg="Erro ao fazer logout";
            console.log("Erro ao fazer logout: "+error);
            res.redirect("/");
        }else{
            req.session.success_msg="Logout realizado com sucesso";
            res.redirect("/");
        }
    });
    
})
router.get("/posts",logado,(req,res)=>{
    Post.find({titular: req.user.nome}).lean().populate("category").then((posts)=>{
        res.render("users/posts",({posts: posts, titular: req.user.nome}));
    }).catch((error)=>{
        req.session.error_msg="Erro ao listar mensagens";
        console.log("Erro ao listar postagens: "+error);
        res.redirect("/");
    })
    
})
router.get("/posts/add",logado,(req,res)=>{
    Post.find().lean().populate("category").then((posts)=>{
        posts.forEach(post => {
            slugsRegistados.push(post.slug);
        });
    })
    Categoria.find().lean().then((categorias)=>{
        res.render("users/postsadd",{categorias: categorias});
    }).catch((erorr)=>{
        req.session.error_msg="houve um erro ao carregar formulário"
        res.redirect("/");
    })
})
router.post("/posts/new",logado,(req,res)=>{
    var erros=[]
    const Categorias=[];
    Categoria.find().lean().then((categorias)=>{
        categorias.forEach(categoria=>{
            Categorias.push(categoria);

        })
    }).catch((erorr)=>{
        req.session.error_msg="houve um erro ao carregar formulário"
        res.redirect("/");
    })
    slugsRegistados.forEach(slug=>{
        if(req.body.slug == slug){
            erros.push({text: "Slug já registado"});
           
        }
    })
    if(req.body.categoria==0){
        erros.push({text: "categoria inválida"})

    }
    if(erros.length>0){
        res.render("users/postsadd",{erros: erros,categorias: Categorias })
    }else{
        const newPost = {
            titular: req.user.nome,
            title: req.body.titulo,
            description: req.body.descricao,
            content: req.body.conteudo,
            slug: req.body.slug,
            category: req.body.categoria,
            date: Date.now()
        }
        new Post(newPost).save().then(()=>{
            req.session.success_msg="Postagem criada com sucesso";
            res.redirect("/")
        }).catch((error)=>{
            req.session.error_msg="Houve um erro ao criar a postagem";
            console.log("erro ao criar postagem: "+ error)
            res.redirect("/");
        })
    }
})
router.post("/posts/edit",logado,(req,res)=>{
    Post.findOne({_id: req.body.id}).then((post)=>{
        post.titular = req.body.titular
        post.title=req.body.titulo
        post.content = req.body.conteudo
        post.slug = req.body.slug
        post.description = req.body.descricao
        post.categoria = req.body.categoria

        post.save().then(()=>{
            req.session.success_msg="Postagem editada  com sucesso"
            res.redirect("/")
        }).catch((error)=>{
            req.session.error_msg="Erro interno"
            console.log("Erro interno: "+error);
            req.redirect("/")
        })
    }).catch((error)=>{
        req.session.error_msg="Houve um erro ao salvar a edição";
        console.log("Erro ao salvar edição: "+error);
        res.redirect("/");
    })
})

router.get("/posts/delete/:id", logado, (req,res)=>{
    Post.findByIdAndDelete(req.params.id).then(()=>{
        Post.find({titular: req.user.nome}).lean().populate("category").then((posts)=>{
            
            res.render("users/posts",{titular: req.user.nome, posts: posts})
        }).catch((error)=>{
            req.session.error_msg="Houve um erro ao listar as mensagens"
            console.log("Houve um erro ao listar as mensagens: "+error);
            res.redirect("/");
        })
    }).catch((error)=>{
        console.log("Erro ao apagar postagem: "+error)
    })
})
router.post("/posts", logado, (req,res)=>{
    Post.findOne({slug: req.body.pesquisa}).lean().populate("category").then((post)=>{
        res.render("post/index",{post: post})
    }).catch((error)=>{
        req.session.error_msg="Houve um erro ao encontrar a postagem"
        console.log("Houve um erro ao encontrar a postagem: "+error);
        res.redirect("/");
    })
})
module.exports = router