module.exports= {
    logado: (req,res,next)=>{

        if(req.isAuthenticated()){
            return next();
        }else{
            req.session.error_msg="Você precisa estar com sua sessão iniciada";
            res.redirect("/");
        }
    }
}
