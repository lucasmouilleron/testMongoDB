module.exports = function(grunt) {

  /////////////////////////////////////////////////////////////////////////
  var sh = require("execSync");
  var moment = require("moment");
  var fs = require("fs");
  var util  = require("util");
  var spawn = require("child_process").spawn;
  var recursive = require("recursive-readdir");
  /////////////////////////////////////////////////////////////////////////
  var cfg = grunt.file.readJSON("config.json");
  var pkg = grunt.file.readJSON("package.json");
  var version = moment().format("YYYY-MM-DD-HH-mm");

  /////////////////////////////////////////////////////////////////////////
  grunt.initConfig({
    pkg: pkg,
    cfg: cfg,
    version: version,
    distDir:"../dist",
    deployDir:"../www",
    availabletasks: {
      tasks: {
        options: {
          sort: true,
          filter: "include",
          tasks: ["default","install", "db","cleanup", "compile:scripts", "compile:styles","test:android","test:ios"]
        }
      }
    },
    prompt: {
      env: {
        options: {
          questions: [{
            config:"envChoosen",
            type: "list",
            message: "Env ?",
            default: "preprod",
            choices: ["preprod","prod"]
          }]
        }
      }
    },
    concat: {
      options: {
        separator: ";",
      },
      dist: {
        src: ["<%=jsFiles%>"],
        dest: "<%=cfg.jsDir%>/app-all.js",
      }
    },
    uglify: {
      options: {
        report: "min",
        mangle: false
      },
      dist: {
        files: {
          "<%=cfg.jsDir%>/app-all.js": ["<%=cfg.jsDir%>/app-all.js"]
        }
      }
    },
    replace: {
      deployVersion: {
        src: "<%=cfg.version.propertyFiles%>",
        overwrite: true,
        replacements: [{
          from: new RegExp(cfg.version.propertyName+":(.*),","g"),
          to: "<%=cfg.version.propertyName%>:'<%=version%>',"
        }, {
          from: /\?v=(.*)\"/g,
          to: "?v=<%=version%>\""
        }]
      }
    },
    shell: {
      options: {
        stdout: true,
        stderr: true,
        stdin: true
      },
      runDB: {
        command: "sudo mongod --fork --logpath <%=cfg.dataLogFile%> --port 27017 --dbpath <%=cfg.dataDir%> --auth"
      },
      install: {
        command: "bower cache clean && bower install"
      },
      installAdditional: {
        command: function() {
          if(cfg.installCommands) {
            return cfg.installCommands.join("&&");
          }
          else {
            return "";
          }
        }
      },
      cleanAdditional: {
        command: function() {
          if(cfg.cleanCommands) {
            return cfg.cleanCommands.join("&&");
          }
          else {
            return "";
          }
        }
      },
      runios: {
        command: "ionic emulate ios"
      },
      runiosdevice: {
        command: "ionic run ios"
      },
      runandroid: {
        command: "ionic emulate android"
      }
    },
    compass: {
      compile: {
        options: {
          httpPath: "<%=cfg.baseURL%>",
          sassDir: "<%=cfg.sassDir%>",
          cssDir: "<%=cfg.cssDir%>",
          imagesDir: "<%=cfg.imgDir%>",
          fontsDir: "<%=cfg.fontsDir%>",
          httpStylesheetsPath:"<%=cfg.cssDir%>",
          cacheDir: "<%=localDir%>/.sass-cache",
          outputStyle:"compressed",
          relativeAssets:true,
          lineComments:false,
          force: true,
          raw: "preferred_syntax = :sass\n",
          environment: "production",
          require: ["sass-css-importer"]
        }
      }
    },
    copy: {
    },
    clean: {
      options: { 
        force: true 
      },
      default: {
        src: "<%=cfg.cleanFiles%>"
      }
    },
    copyFiles: {
      main: {
        files: "<%=cfg.copyFiles%>"
      }
    },
    autoprefixer: {
      options: {
       browsers: ["last 2 version"]
     },
     default: {
       files: [{
        expand: true, 
        cwd: "<%=cfg.cssDir%>/",
      src: "{,*/}*.css",
      dest: "<%=cfg.cssDir%>/"
    }]
  }
}
});

  /////////////////////////////////////////////////////////////////////////
  grunt.loadNpmTasks("grunt-available-tasks");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-compass");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-autoprefixer");
  grunt.loadNpmTasks("grunt-shell");
  grunt.loadNpmTasks("grunt-prompt");
  grunt.loadNpmTasks("grunt-text-replace");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-rename");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  /////////////////////////////////////////////////////////////////////////
  grunt.registerTask("default", "These help instructions",["availabletasks"]);
  grunt.registerTask("cleanup", "Clean project",["shell:cleanAdditional","clean:default"]);
  grunt.registerTask("install", "Install the project",["shell:install","copyFiles:main"]);
  grunt.registerTask("installDevice", "Install the project for device deploys",["shell:installAdditional"]);
  grunt.registerTask("compile:scripts", "Compile script files",["extractJSFilesFromIndex","concat:dist","uglify:dist"]);
  grunt.registerTask("compile:styles", "Compile sass files",["compass:compile"]);
  grunt.registerTask("build", "Build all (scripts + styles)",["install", "compile:styles","compile:scripts"]);
  grunt.registerTask("buildDevice", "Build all (scripts + styles) + device",["installDevice", "build"]);
  grunt.registerTask("test:ios", "Run on iOS simulator",["buildDevice", "shell:runios"]);
  grunt.registerTask("test:android", "Run on Android simulator",["buildDevice", "shell:runandroid"]);
  grunt.registerTask("db", "Run DB",["shell:runDB"]);

  /////////////////////////////////////////////////////////////////////////
  grunt.task.registerTask("buildCacheManifest", function() {
    var done = this.async();
    var distDir = grunt.config("distDir");
    var manifest = "CACHE MANIFEST\n#"+new Date().getTime()+"\n\nCACHE:\n";
    recursive(distDir, [".*", "*.php","cache.manifest"], function (err, files) {
      for(var i =0 ; i < files.length; i++) {
        manifest+=files[i].replace(distDir+"/","")+"\n";
      }
      manifest+="\nNETWORK:\n*"
      grunt.file.write(distDir+"/cache.manifest", manifest);
      done();
    });
  });

  /////////////////////////////////////////////////////////////////////////
  grunt.task.registerTask("extractJSFilesFromIndex", function() {
    var indexDebugFile = grunt.config("cfg").indexDebugFile;
    var content = grunt.file.read(indexDebugFile);
    var pattern = /src=\"(.*)\.js/g;
    var filesFound = pattern.exec(content);
    var jsFiles = [];
    while (filesFound != null) {
      jsFiles.push(grunt.config("deployDir")+"/"+filesFound[1]+".js");
      filesFound = pattern.exec(content);
    }
    grunt.config("jsFiles",jsFiles);
  });

  /////////////////////////////////////////////////////////////////////////
  grunt.task.registerMultiTask("copyFiles", function() {
    var path = require("path");
    for(file in this.data.files) {
      var filesCopy = grunt.file.expand(file);
      for(fileCopy in filesCopy) {
        var from = filesCopy[fileCopy];
        var to = path.join(this.data.files[file], path.basename(from));
        grunt.log.ok("Copying "+from+" to "+to)
        grunt.file.copy(from, to);
      }
    }
  });

  /////////////////////////////////////////////////////////////////////////
  function startsWith(string1, string2) {
    return string1.indexOf(string2) == 0;
  }

};