/*
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of Genome Maps.
 *
 * Genome Maps is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Genome Maps is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Genome Maps. If not, see <http://www.gnu.org/licenses/>.
 */

function GenomeMaps(args) {

    _.extend(this, Backbone.Events);

    this.id = Utils.genId("GenomeMaps");

    //set default args
    this.suiteId = 9;
    this.title = 'Genome Maps';
    this.description = "Genomic data visualization";
    this.version = "3.1.7a";
    this.border = true;
    this.trackIdCounter = 1;
    this.resizable = true;
    this.targetId;
    this.width;
    this.height;


    this.checkAccountFileIndexes = true;
    this.checkExampleAccount = true;

    //set instantiation args, must be last
    _.extend(this, args);

    this.accountData = null;

    this.rendered = false;
    if (this.autoRender) {
        this.render();
    }
}

GenomeMaps.prototype = {
    render: function (targetId) {
        var _this = this;

        this.targetId = (targetId) ? targetId : this.targetId;
        if ($('#' + this.targetId).length < 1) {
            console.log('targetId not found in DOM');
            return;
        }

        console.log("Initializing GenomeMaps");

        this.targetDiv = $('#' + this.targetId)[0];
        this.div = $('<div id="genome-maps"></div>')[0];
        $(this.targetDiv).addClass('genome-maps').append(this.div);

        $(this.div).append('<div id="gm-header-widget"></div>');
        $(this.div).append('<div id="gm-genome-viewer"></div>');
        $(this.div).append('<div id="gm-statusbar-widget"></div>');
        this.width = ($(this.div).width());

        if (this.border) {
            var border = (_.isString(this.border)) ? this.border : '1px solid lightgray';
            $(this.div).css({border: border});
        }

        // Resize
        if (this.resizable) {
            $(window).resize(function (event) {
                if (event.target == window) {
                    if (!_this.resizing) {//avoid multiple resize events
                        _this.resizing = true;
                        setTimeout(function () {
                            _this.setWidth($(_this.div).width());
                            _this.resizing = false;
                        }, 400);
                    }
                }
            });
        }

        //SAVE CONFIG IN COOKIE
        $(window).unload(function () {
            var value = {
                species: {
                    name: _this.genomeViewer.speciesName,
                    species: _this.genomeViewer.species,
                    chromosome: _this.genomeViewer.chromosome,
                    position: _this.genomeViewer.position}
            };
            $.cookie("gm_settings", JSON.stringify(value), {expires: 365});
        });

        this._config();

        this.rendered = true;
    },
    _config: function () {

        this.region = new Region();

        var url = $.url();
        var url_cbhost = url.param('CELLBASE_HOST');
        if (url_cbhost != null) {
            CELLBASE_HOST = url_cbhost;
        }

        speciesObj = DEFAULT_SPECIES;
        var urlSpecies = url.param('species');
        if (typeof urlSpecies !== 'undefined' && urlSpecies != '') {
            speciesObj = Utils.getSpeciesFromAvailable(AVAILABLE_SPECIES, urlSpecies) || speciesObj;
        }
        this.species = speciesObj;
        this.region.load(speciesObj.region);
        //console.log(speciesObj);

        var regionStr = url.param('region');
        if (regionStr != null) {
            this.region.parse(regionStr);
        }

        var urlZoom = parseInt(url.param('zoom'));
        if (isNaN(urlZoom) || urlZoom > 100 || urlZoom < 0) {
            urlZoom = null;
        }

        var urlGene = url.param('gene');
        if (urlGene != null && urlGene != "") {
            this.region.load(this.getRegionByFeature(urlGene, "gene"));
        }
        var urlSnp = url.param('snp');
        if (urlSnp != null && urlSnp != "") {
            this.region.load(this.getRegionByFeature(urlSnp, "snp"));
        }

        //visualiaztion URL paramaters
        var confPanelHidden = CONFPANELHIDDEN;
        if (url.param('confpanel') === 'false') {
            confPanelHidden = true;
        }
        var regionPanelHidden = REGIONPANELHIDDEN;
        if (url.param('regionpanel') === 'false') {
            regionPanelHidden = false;
        }

    },

    draw: function () {
        var _this = this;

        if (!this.rendered) {
            console.info('Genome Maps is not rendered yet');
            return;
        }

        /* Header Widget */
        this.headerWidget = this._drawHeaderWidget('gm-header-widget');
        this.updateSpecies(this.species);

        /* Status Bar  */
        this.statusBar = this._drawStatusBar('gm-statusbar-widget');

        /* Genome Viewer  */
        this.genomeViewer = this._drawGenomeViewer('gm-genome-viewer');

        /* Navigation Bar */
        this.navigationBar = this._drawNavigationBar(this.genomeViewer.getNavigationPanelId());

        /* Side Panel  */
        this.sidePanel = this._drawSidePanel(this.genomeViewer.getRightSidePanelId());


        //check login
        if ($.cookie('bioinfo_sid') != null) {
            this.sessionInitiated();
        } else {
            this.sessionFinished();
        }
    },

    _drawHeaderWidget: function (targetId) {
        var _this = this;
        return undefined;
    },
    _drawSidePanel: function (targetId) {
        var _this = this;
        return undefined;
    },
    _drawStatusBar: function (targetId) {
        var _this = this;
        return undefined;
    },
    _drawNavigationBar: function (targetId) {
        var _this = this;
        return undefined;
    },
    _drawGenomeViewer: function (targetId) {
        var _this = this;

        var genomeViewer = new GenomeViewer({
            targetId: targetId,
            autoRender: true,
            sidePanel: false,
            region: this.region,
            species: this.species,
            border: false,
            version: this.version,
            resizable: false,
            availableSpecies: AVAILABLE_SPECIES,
            popularSpecies: POPULAR_SPECIES,
            drawNavigationBar: true,
            drawStatusBar: true,
            drawRegionOverviewPanel: true,
            handlers: {
                'species:change': function (event) {
                    _this.species = event.species;
                    _this.updateSpecies(_this.species);
                }
            }
        });
        genomeViewer.draw();

        genomeViewer.chromosomePanel.hide();
        genomeViewer.karyotypePanel.hide();


        // create default tracks
        var renderer = new FeatureRenderer(FEATURE_TYPES.gene);
        renderer.on({
            'feature:click': function (event) {
                _this.trigger('feature:click', event);
            }
        });
        var gene = new FeatureTrack({
            targetId: null,
            id: 'Features',
            minHistogramRegionSize: 20000000,
            maxLabelRegionSize: 10000000,
            height: 100,

            renderer: renderer,

            dataAdapter: new CellBaseAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "gene",
                params: {
                    exclude: 'transcripts'
                },
                species: genomeViewer.species,
                cacheConfig: {
                    chunkSize: 50000
                }
            })
        });
        genomeViewer.addOverviewTrack(gene);

        var tracks = [];

        this.sequence = new SequenceTrack({
            height: 22,
            visibleRegionSize: 400,
            renderer: new SequenceRenderer(),
            dataAdapter: new SequenceAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "sequence",
                species: genomeViewer.species
            })
        });
        tracks.push(this.sequence);

        this.gene = new GeneTrack({
            title: 'Gene',
            minHistogramRegionSize: 20000000,
            maxLabelRegionSize: 10000000,
            minTranscriptRegionSize: 500000,
            height: 150,
            renderer: new GeneRenderer({
                handlers: {
                    'feature:click': function(e) {
                        _this.trigger('feature:click', e);
                        // switch (e.featureType) {
                        //     case "gene":
                        //         new GeneInfoWidget(null, this.dataAdapter.species).draw(args);
                        //         break;
                        //     case "transcript":
                        //         new TranscriptInfoWidget(null, this.dataAdapter.species).draw(args);
                        //         break;
                        //     default:
                        //         break;
                        // }
                    }
                }
            }),
            dataAdapter: new CellBaseAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "gene",
                species: genomeViewer.species,
                params: {
                    exclude: 'transcripts.tfbs,transcripts.xrefs,transcripts.exons.sequence,chunkIds'
                },
                cacheConfig: {
                    chunkSize: 100000
                }
            })
        });
        tracks.push(this.gene);


        var renderer = new FeatureRenderer(FEATURE_TYPES.snp);
        renderer.on({
            'feature:click': function (event) {
                _this.trigger('feature:click', event);
            }
        });
        this.snp = new FeatureTrack({
            targetId: null,
            id: 'Snps',
            title: 'SNP',
            featureType: 'SNP',
            minHistogramRegionSize: 12000,
            maxLabelRegionSize: 3000,
            height: 100,
            renderer: renderer,
            dataAdapter: new CellBaseAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "snp",
                params: {
                    exclude: 'transcriptVariations,xrefs,samples'
                },
                species: genomeViewer.species,
                cacheConfig: {
                    chunkSize: 10000
                }
            })
        });
        tracks.push(this.snp);

        genomeViewer.addTrack(tracks);


        this.on('feature:click', function (event) {
            console.log('feature:click', event);
        });

        return genomeViewer;
    },

    updateSpecies: function(species) {
        var text = species.text + ' <span style="color: #8396b2">' + species.assembly + '</span>';
        if (this.headerWidget) { this.headerWidget.setDescription(text); }
        this.trigger('headerWidget:updateSpecies', { sender: this });
    },
    setWidth: function (width) {
        this.width = width;
        this.genomeViewer.setWidth(width);
        if (this.headerWidget) { this.headerWidget.setWidth(width); }
        if (this.statusBar) { this.statusBar.setWidth(width); }
    },

    getRegionByFeature: function (name, feature) {
        var speciesCode = Utils.getSpeciesCode(this.species.text);
        var data = CellBaseManager.get({
            species: speciesCode,
            category: 'feature',
            subCategory: feature,
            query: name,
            resource: 'info',
            params: {
                include: 'chromosome,start,end'
            },
            async: false
        });

        var f = data.response[0].result[0];
        if (_.isObject(f)) {
            return {chromosome: f.chromosome, start: f.start, end: f.end}
        }
        return {};
    },

    sessionInitiated: function () {
        this.trigger('session:initialized', { sender: this });
    },
    sessionFinished: function () {
        this.trigger('session:finished', { sender: this });
        this.accountData = null;
    },
    setAccountData: function (response) {
        this.accountData = response;
        this.trigger('session:updateAccountData', JSON.parse(JSON.stringify(response)));
    }
};
