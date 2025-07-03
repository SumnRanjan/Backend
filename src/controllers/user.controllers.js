import {asyncHandler} from '../utils/asyncHandler.js'

const registerUser = asyncHandler(async (req , res) =>{
    //get user details from frontend
    //validation
    //check if user already exist : username , email
    //check for images , check for avatar
    //upload them to cloudinary , avatar
    //create userobject = create entry in db
    //remove user password and refresh token from response
    //check for user creation
    //return res

})

export {registerUser}