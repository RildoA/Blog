const Express = require('express');
const router = Express.Router();
const mongoose = require("mongoose");
require("../models/Category");
const Categoria = mongoose.model("categorias")
require('../models/Post')
const Post = mongoose.model("postagens")
const {ehAdmin} = require("../helpers/ehAdmin");

router.get('/', ehAdmin, (req, res)=>{
    
    Post.find().lean().populate("category").sort({date:"desc"}).then((posts)=>{
        res.render("admin/index",{posts: posts, nome:req.user.nome})
    }).catch((error)=>{
        req.session.error_msg="Houve um erro ao listar as postagens";
        console.log("Houve um erro ao listar as postagens: "+ error)
        res.redirect("/admin")
    })
});
router.get('/category',ehAdmin, (req,res)=>{
    Categoria.find().sort({date:"desc"}).lean().then((categorias)=>{
        res.render("admin/category",{categorias:categorias})
    }).catch((error)=>{
        req.session.error_msg= "Houve um erro ao listar as categorias: ";
        console.log(error);
        res.redirect("/admin")
    })
    
})
router.get('/category/add', ehAdmin, (req,res)=>{
    res.render("admin/categoryadd");
})
router.get('/category/edit/:id',(req,res)=>{
    Categoria.findOne({_id: req.params.id}).lean().then((categoria)=>{
        res.render("admin/categoryedit",{category: categoria})
    }).catch((error)=>{
        req.session.error_msg = "Esta categoria não existe";
        res.redirect("/admin/category");
    })
    
})
router.post("/category/new", ehAdmin, (req,res)=>{

    var erros = [];
    if(!req.body.nome || typeof(req.body.nome) == undefined || req.body.nome == null){
        erros.push({text: "Nome inválido"})
    }
    if(!req.body.slug || typeof(req.body.slug) == undefined || req.body.slug == null){
        erros.push({text: "Slug inválido"})
    }
    if(req.body.nome.length<2){
        erros.push({text: "Nome da categoria muito pequeno"})
    }
    if(erros.length>0){
        res.render("admin/categoryadd",{erros: erros})
    }
    else{
        
    const newCategory = {
        nome: req.body.nome,
        slug: req.body.slug
    }
    new Categoria(newCategory).save().then(()=>{
        req.session.success_msg = "Categoria criada com sucesso";
        res.redirect("/admin/category")
    }).catch((error)=>{
        req.session.error_msg="Houve um erro ao tentar regostar a categoria, tente novamente";
    })
    }

})
router.post("/category/edit", ehAdmin, (req,res)=>{
    Categoria.findOne({_id: req.body.id}).then((categoria)=>{
        categoria.nome = req.body.nome
        categoria.slug = req.body.slug

        categoria.save().then(()=>{
            req.session.success_msg = "Categoria editada com sucesso";
            res.redirect("/admin/category")
        }).catch((error)=>{
            req.session.error_msg = "Houve uma falha interna ao salvar a editação da categoria";
            res.redirect("/admin/category")
        })

    }).catch((error)=>{
        req.session.error_msg = "Houve um erro ao editar a categoria";
        res.redirect("/admin/category")
    })
})
router.post("/category/delete", ehAdmin, (req,res)=>{
    Categoria.findByIdAndDelete(req.body.id).then(()=>{
        req.session.error_msg = "Categoria apagada";
        res.redirect("/admin/category");
    }).catch((error)=>{
        req.session.error_msg="Houve um erro ao apagar a categoria";
        res.redirect("/admin/category");
    })
})
router.get("/posts", ehAdmin, (req,res)=>{
    Post.find().lean().populate("category").sort({date:"desc"}).then((posts)=>{
        res.render("admin/posts",{posts: posts})
    }).catch((error)=>{
        req.session.error_msg="Houve um erro ao listar as postagens";
        console.log("Houve um erro ao listar as postagens: "+ error)
        res.redirect("/admin")
    })
    
})
router.get("/posts/add", ehAdmin, (req,res)=>{
    Categoria.find().lean().then((categorias)=>{
        res.render("admin/postsadd",{categorias: categorias});
    }).catch((erorr)=>{
        req.session.error_msg="houve um erro ao carregar formulário"
        res.redirect("/admin");
    })
})
router.post("/posts/new", ehAdmin, (req,res)=>{
    var erros=[]
    if(req.body.categoria==0){
        erros.push({text: "categoria inválida, registe um categoria"})

    }
    if(erros.length>0){
        res.render("admin/postsadd",{erros: erros})
    }else{
        const newPost = {
            titular: req.user.nome,
            title: req.body.titulo,
            description: req.body.descricao,
            content: req.body.conteudo,
            slug: req.body.slug,
            category: req.body.categoria
        }
        new Post(newPost).save().then(()=>{
            req.session.success_msg="Postagem criada com sucesso";
            res.redirect("/admin/posts")
        }).catch((error)=>{
            req.session.error_msg="Houve um erro ao criar a postagem";
            console.log("erro ao criar postagem: "+ error)
            res.redirect("/admin/posts");
        })
    }
})
router.get("/posts/edit/:id",ehAdmin, (req,res)=>{
    Post.findOne({_id:req.params.id}).lean().then((post)=>{
        Categoria.find().lean().then((categorias)=>{
            res.render("admin/postsedit", {categorias: categorias, post: post, titular: req.user.nome})
        }).catch((error)=>{
            req.session.error_msg="Houve um erro ao listar as categorias"
            res.redirect("/admin/posts")
        })
    }).catch((error)=>{
        req.session.error_msg="Houve um erro ao carregar formulário"
        res.redirect("/admin/posts")
    })
    
})
router.post("/posts/edit",ehAdmin,(req,res)=>{
    Post.findOne({_id: req.body.id}).then((post)=>{
        post.titular = req.body.titular
        post.title=req.body.titulo
        post.content = req.body.conteudo
        post.slug = req.body.slug
        post.description = req.body.descricao
        post.categoria = req.body.categoria

        post.save().then(()=>{
            req.session.success_msg="Postagem editada  com sucesso"
            res.redirect("/admin/posts")
        }).catch((error)=>{
            req.session.error_msg="Erro interno"
            console.log("Erro interno: "+error);
            req.redirect("/admin/posts")
        })
    }).catch((error)=>{
        req.session.error_msg="Houve um erro ao salvar a edição";
        console.log("Erro ao salvar edição: "+error);
        res.redirect("/admin/posts");
    })
})
router.get("/posts/delete/:id", ehAdmin, (req,res)=>{
    Post.findByIdAndDelete(req.params.id).then(()=>{
        res.redirect("/admin/posts")
    }).catch((error)=>{
        console.log("Erro ao apagar postagem: "+error)
    })
})
module.exports = router;