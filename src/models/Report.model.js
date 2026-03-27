//stores saved reports- single analysis or comparison of multiple
//private- createdBy field ensures each user sees only their own reports

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
    {
        //Report title- user sets this
        title:{
            type:String,
            required: [true, "Report title is required"],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },

        //"single" = one developer analyzed
        //"comparison" = two or more developers compared
        type:{
            type:String,
            enum: ["single", "comparison"],
            default: "single"
        },

        //which platform user created this report
        createdBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        //for single reports- one analysis
        analysisIds:[
            {    
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Analysis'
            }
        ],

        //snapshot: scores frozen at time of report creation
        //even if student pushes more code later, this report stays as-is
        //This is exactly how a marksheet works- frozen at exam date
        snapshot:{
            type: mongoose.Schema.Types.Mixed,
            //Stores: {"john123": {totalScore: 82, ...}, "alice99": {...}}
        },

        //Recruiter's personal notes on this report
        notes:{
            type: String,
            default: '',
            maxlength: [2000, 'Notes cannot exceed 2000 characters'],
        },

        //Pdf file path after generation
        pdfPath:{
            type:String,
            default: null,
        },

        //How many times this report was downloaded
        downloadedCount:{
            type:Number,
            default: 0
        },

    }
,{
    timestamps: true
});

//fast query: 'give me all reports by this user, newest first'
ReportSchema.index({createdBy:1, createdAt: -1});

const ReportModel = mongoose.model("Report", ReportSchema);

module.exports = ReportModel;