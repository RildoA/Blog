//helpers são arquivos que servem para ajudar com alguma coisa
//este helper serve para ajudar a verificar se o usário é um adm ou não
module.exports = {
    ehAdmin: (req,res,next)=>{
        if(req.isAuthenticated() && req.user.ehAdmin==1){
            return next();
        }else{
            req.session.error_msg="Você precisa ser um admnistrador"
            res.redirect("/");
        }
    }
}