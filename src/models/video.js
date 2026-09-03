import mongoos,{Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = Schema(
  {
    videoFile:{
      type: String, //cloudinary url
      requierd: true
    },
    tumbnail:{
      type: String, //cloudinary url
      requierd: true  
    },
    title:{
      type: String,
      required: true,
    },
    description:{
      type: String,
      required: true,
    },
    duration:{
      type: Number,//cloudinary url
      required: true,
    },
    views:{
      type: Number,
      default: 0
    },
    isPublished:{
      type: Boolean,
      default: true
    },
    owner:{
      type: Schema.Types.ObjectId,
      ref: "User",
    }


  },
  {
    timestamps: true
  }
)
videoSchema.plugin(mongooseAggregatePaginate)


export const Video= mongoos.model("Video",videoSchema)