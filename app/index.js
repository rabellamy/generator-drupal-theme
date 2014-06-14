'use strict';
var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var sh = require('execSync');
var _s = require('underscore.string');
var fs = require('fs');

// Here, we add in extra prompts and settings from our base themes.
var baseThemeList = [
  { name: "No Base Theme", value: null },
  { name: "Zen", value: "zen"},
  { name: "Aurora", value: "aurora", file: "./Aurora.js" },
  { name: "Omega 4.x", value: "omega", file: "./Aurora.js" },
  { name: "Mothership", value: "mothership"}
];


var Generator = yeoman.generators.Base.extend({
  init: function () {
    this.pkg = require('../package.json');

    this.on('end', function () {
      if (!this.options['skip-install']) {
        this.installDependencies();
      }
    });
  }
});

Generator.prototype.askForBase = function () {
  var done = this.async();

  // Have Yeoman greet the user.
  this.log(yosay('Welcome to the marvelous DrupalTheme generator!'));

  var prompts = [
    {
      type: 'string',
      name: 'projectName',
      message: 'What\'s your theme\'s name?' + chalk.red(' (Required)'),
      validate: function (input) {
        if (input === '') {
          return 'Please enter your theme\'s name';
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'baseTheme',
      message: 'Which base theme would you like to use?',
      choices: baseThemeList,
      default: null,
    }
  ];

  this.prompt(prompts, function (props) {
    this.projectName = props.projectName;
    this.projectSlug = _s.slugify(props.projectName);
    this.baseTheme = props.baseTheme;

    this.config.set('projectName', this.projectName);
    this.config.set('projectSlug', this.projectSlug);
    this.config.set('baseTheme', this.baseTheme);

    done();
  }.bind(this));
};

Generator.prototype.askForSubs = function() {
  var done = this.async();
  var baseTheme = this.baseTheme;
  var baseThemeConfig = null;

  baseThemeList.forEach( function(element, index, array) {
    if (element.value == baseTheme && element.file != undefined) {
      baseThemeConfig = require(element.file);
    }
  });

  // We do not want to try and get more options if they do not exist.
  if (baseThemeConfig !== null) {
    var prompts = baseThemeConfig.askFor();
    this.prompt(prompts, function (props) {
      this.baseThemeSettings = props;
      this.config.set('baseThemeSettings', this.baseThemeSettings);

      done();
    }.bind(this));
  }
  else {
    done();
  }


};

Generator.prototype.askForAdvanced = function() {
  var done = this.async();
  var onlyWhen = function( answers ) {
    return answers.advFileOptions;
  }

  // First, set our general defaults.
  this.sassDir = 'sass';
  this.cssDir = 'css';
  this.jsDir = 'js';
  this.templateDir = 'tpl';

  this.prompt([
    {
      type: "confirm",
      name: "advFileOptions",
      message: "Do you want to customize your theme's directories?",
      default: false
    },
    {
      type: "input",
      name: "sassDir",
      message: "Sass directory?",
      default: this.sassDir,
      when: onlyWhen
    },
    {
      type: "input",
      name: "cssDir",
      message: "CSS directory?",
      default: this.cssDir,
      when: onlyWhen
    },
    {
      type: "input",
      name: "jsDir",
      message: "JavaScript directory?",
      default: this.jsDir,
      when: onlyWhen
    },
    {
      type: "list",
      name: "templateDir",
      message: "Template directory?",
      choices: ['tpl', 'templates'],
      default: this.templateDir,
      when: onlyWhen
    }
  ], function (props) {

    // If they wanted the advanced options, use those.
    if (props.advFileOptions) {
      // TODO: Instead, make sure the input is sanitized already?
      this.sassDir = _s.slugify(props.sassDir);
      this.cssDir = _s.slugify(props.cssDir);
      this.jsDir = _s.slugify(props.jsDir);
      this.templateDir = props.templateDir;
    }

    this.config.set('sassDir', this.sassDir);
    this.config.set('cssDir', this.cssDir);
    this.config.set('jsDir', this.sassDir);
    this.config.set('templateDir', this.templateDir);

    done();
  }.bind(this));

};


Generator.prototype.drupal = function () {
  // Create our theme directory
  this.mkdir(this.projectSlug);
  // Set our destination to be the new directory.
  this.destinationRoot(this.projectSlug);

  this.mkdir(this.sassDir);
  this.mkdir(this.cssDir);
  this.mkdir(this.jsDir);
  this.mkdir(this.templateDir);

  this.template('_theme.info', this.projectSlug + '.info');

  //this.copy('_package.json', 'package.json');
  //this.copy('_bower.json', 'bower.json');
};

Generator.prototype.projectfiles = function () {
  this.copy('editorconfig', '.editorconfig');
  this.copy('jshintrc', '.jshintrc');
};

module.exports = Generator;