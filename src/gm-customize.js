;

function initialize_custom() {
    OpencgaManager.setHost("http://localhost:8000/opencga-server-beta/rest");
    $.cookie("bioinfo_sid", "tvp36wV5inMN97s6rxw5");

    (function() {
        // add bam track
        var object = {"acl":[],"creationTime":"20130524163241","date":"20130524163241","description":"","diskUsage":188671102,"fileBioType":"","fileFormat":"bam","fileName":"HG00096.chrom20.ILLUMINA.bwa.GBR.exome.20111114.bam","fileType":"r","organization":"","responsible":"","status":"ready","bucketId":"default","oid":"HG00096.chrom20.ILLUMINA.bwa.GBR.exome.20111114.bam","leaf":true,"icon":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR…b6Df7wB/5eA+4zmEyehxk451itPrhFksSxUeP+lf+z+wXwdayJk/mqtgAAAABJRU5ErkJggg==","text":"HG00096.chrom20.ILLUMINA.bwa.GBR.exome.20111114.bam","qtip":"HG00096.chrom20.ILLUMINA.bwa.GBR.exome.20111114.bam","account":"bam"};
        var bamTrack = new BamTrack({
            targetId: null,
            title: "HG00096.chrom20.ILLUMINA.bwa.GBR.exome.20111114.bam",
            histogramZoom: 0,
            height: 200,
            visibleRange: {start: 60, end: 100},

            renderer: new BamRenderer(FEATURE_TYPES.bam),

            dataAdapter: new BamAdapter({
                category: "bam",
                resource: object,
                species: genomeMaps.species,
                cacheConfig: {
                    chunkSize: 50000
                },
                filters: {},
                options: {},
                featureConfig: FEATURE_CONFIG.bam
            })
        });

        genomeMaps.addTrack(bamTrack);
    })();


    function handleDragEnter(e) {
        e.preventDefault();
        $("#dropreception").addClass('dropacceptable');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        $("#dropreception").removeClass('dropacceptable');
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'copy';
        return false;
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        e.preventDefault();
        $("#dropreception").removeClass('dropacceptable');

        console.log(e.originalEvent.dataTransfer.files);
        var infiles = {};
        Array.prototype.slice.call(e.originalEvent.dataTransfer.files).forEach(function(v) {
            infiles[v.name] = v;
            if (/bai$/.test(v.name)) { infiles.bai = v; }
            if (/bam$/.test(v.name)) { infiles.bam = v; }
        });

        if (!(infiles.bam && infiles.bai)) {
            console.warn("No files loaded.");
            return false;
        }

        var bamdata = new BamFileDataSource({
            baifile: infiles.bai, bamfile: infiles.bam
        });

        function addBamTrack() {
            // add bam track
            var object = {"acl":[],"fileFormat":"bam","fileName":infiles.bam.name,"fileType":"r","organization":"","responsible":"","status":"ready","bucketId":"default","oid":infiles.bam.name,"leaf":true,"icon":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR…b6Df7wB/5eA+4zmEyehxk451itPrhFksSxUeP+lf+z+wXwdayJk/mqtgAAAABJRU5ErkJggg==","text":infiles.bam.name,"qtip":""};
            var bamTrack = new BamTrack({
                targetId: null,
                title: infiles.bam.name,
                histogramZoom: 0,
                height: 200,
                visibleRange: {start: 60, end: 100},

                renderer: new BamRenderer(FEATURE_TYPES.bam),

                dataAdapter: new BamAdapter({
                    category: "bam",
                    resource: object,
                    species: genomeMaps.species,
                    cacheConfig: {
                        chunkSize: 50000
                    },
                    filters: {},
                    options: {},
                    localDataSource: bamdata,
                    featureConfig: FEATURE_CONFIG.bam
                })
            });

            genomeMaps.addTrack(bamTrack);
        }


        // bamdata.on('bailoaded', function(e) {
        //     console.log("bailoaded", e);
        // });
        bamdata.on('bamready', function(e) {
            console.log("bamready", e);
            var ext = GM_CHROMOSOME_CUSTOM.getMatchingTable(
                        genomeMaps.species, e.bamheader.indexToChr, e.bamheader.chrToIndex);

            // set default chromosome map (use for segment to chromosome)
            e.bamheader.aliasmap = genomeMaps.species.chromosome;

            if (_.isObject(ext)) {
                console.log("Added custom bam reference names:", e.bamheader.indexToChr.join());
                _.extend(e.bamheader.chrToIndex, ext.extmap);
                e.bamheader.aliasmap = ext.aliasmap; // rewrite
            }

            addBamTrack();
        });
        bamdata.on('bamreadloaded', function(e) {
            console.log("bam-readloaded", e);
        });
        bamdata.fetch();

        return false;
    }

    $("body").on("dragenter", handleDragEnter)
    $("#dropreception")
        .on("dragleave", handleDragLeave)
        .on("dragover", handleDragOver)
        .on("drop", handleDrop)
        .on("dragend", handleDragLeave);
}


