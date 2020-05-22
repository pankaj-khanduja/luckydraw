exports.StaticTemplateLoaderService = StaticTemplateLoaderService;

function StaticTemplateLoaderService(ls, log){
	
    var self = this
    ,   config = null
    ,   fs = require('fs')
    ,   pathLib = require('path')
    ,   Handlebars = require('handlebars')
    ,   templatesMap = {}
    ,   appDirPath = null
    ;
	
	function configure(cb){
        config = ls.getAppConfig().services.StaticTemplateLoaderService;
        appDirPath = ls.getAppConfig().baseDirectory;
        templatesMap = loadTemplates(config.path);
		cb(null,true);
    }
    
    function loadTemplates(path){
        log.info('loadTemplates',path);
        var files = fs.readdirSync(path)
        ,   templatesMap = {}
        ;
        for(var key in files){
            var file = files[key]
            ,   content = fs.readFileSync(pathLib.join(path,file),'utf8')
            ,   templateName = pathLib.basename(file).split('.')[0]
            ;
            var template = Handlebars.compile(content);
            templatesMap[templateName] = template;
        }
        return templatesMap;
    }

    function getTemplate(templateName, data){
        log.warn('getting Template', templateName);
        return templatesMap[templateName](data);
    }

    this.configure = configure;
    this.getTemplate = getTemplate;
}