//ray marching fragment shader

uniform vec3      iResolution;           // viewport resolution (in pixels)
uniform float     iTime;                 // shader playback time (in seconds)
uniform float     iTimeDelta;            // render time (in seconds)
uniform int       iFrame;                // shader playback frame
uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec3      keyboard;
uniform float     morphing;
uniform int       user; 

const float INFINITY = 1e20;
const int   NUMBER_OF_STEPS = 100;
const float MIN_HIT_DIST    = 0.001;
const float MAX_TRACE_DIST  = 40.0;
const int ITERATIONS = 5; // how many times to fold
const float SCALE = 1.0; // size of sdf shapes
const float OFFSET = 1.0; // offset for any sdf that uses distance shifting
const vec4 REPETITION_PERIOD = vec4(16.0,5.0,8.0,12.0); // how often to repeat--higher numbers repeat less often

// returns distance to nearest object in the world
float sdf(in vec3 pnt)
{   
    //Prashant
    if(user == 1){
        vec3 p1 = rotate(pnt,vec3(1.),iTime/5.);
        float sphere = sdSphere(pnt,0.4);
        float box = sdBox(p1,vec3(0.3));
        return mix(sphere,box,0.5);
    }

    //Michael
    else if(user == 2){
        vec4 p = vec4(pnt,1.0);
        //p = opRepeat(p, REPETITION_PERIOD); //infinite repetition
        sierpinski_fold(p, ITERATIONS, OFFSET);
        return min(INFINITY, sdTetrahedron(p,SCALE));
    }

    //Siddhant
    if(user == 3){
        float sphere = sdSphere(pnt,0.4);
        float box = sdBox(pnt,vec3(0.3));
        return smin(sphere,box,0.3);
    }

    //Mozhdeh
    if(user == 4){
        vec4 p = vec4(pnt,1.0);
        p = opRepeat(p, REPETITION_PERIOD); //infinite repetition
        float closest = min(sdSphere(p.xyz,SCALE), sdPlane(p.xyz, vec3(0.0, -1.0, 0.0), vec3(0.0, 1.0, 0.0)));
        return min(INFINITY, closest);
    }

    //Kaushik
    if(user == 5){
        float sphere = sdSphere(pnt,0.4);
        float box = sdBox(pnt,vec3(0.3));
        return max(sphere,-box);
    }
}

//calculate the normal of a 3d surface
vec3 calc_norm(in vec3 point)
{
    const vec3 SMALL_STEP = vec3(0.001, 0.0, 0.0);

    float gradient_x = sdf(point + SMALL_STEP.xyy) - sdf(point - SMALL_STEP.xyy);
    float gradient_y = sdf(point + SMALL_STEP.yxy) - sdf(point - SMALL_STEP.yxy);
    float gradient_z = sdf(point + SMALL_STEP.yyx) - sdf(point - SMALL_STEP.yyx);
    return normalize(vec3(gradient_x, gradient_y, gradient_z));
}

vec3 lighting(in vec3 cur_pos)
{
    float ambient = .2;
    float diffuse_c = 0.6;
    float specular_c = 0.4;
    float specular_k = 20.;

    vec4 p = vec4(cur_pos,1.0);
    p = opRepeat(p, REPETITION_PERIOD);
    //replacing cur_pos with p.xyz to have similar lighting for all objects
    
    vec3 N = calc_norm(p.xyz);
    vec3 eyeDir = normalize(-ray);

    //diffuse lighting
    vec3 light_pos = vec3(-5.0, -10.0, -5.0);
    vec3 L = normalize(p.xyz - light_pos); // vector pointing to light
    float diffuse = max(0.0, dot(N, L)); // lambertian

    //specular lighting
    vec3 R = 2.0 * dot(N, L) * N - L;
    float specular = pow( max(dot(R, eyeDir), 0.0), specular_k) ;

    //compute final color for each obj
    vec3 color = vec3(0.0);
    if( abs(p.y + 1.0) < MIN_HIT_DIST ) //plane color
    {
        color = vec3(0.5,0.4,0.5) * ambient; 
    }
    else //sphere color
    {
        color = vec3(1.0,1.0,1.0) * ambient;
        color += vec3(1.0,1.0,1.0) * diffuse * diffuse_c;
        color += vec3(1.0,1.0,1.0) * specular * specular_c ;
    }
    return color;
}

vec3 ray_march(in vec3 cam_pos, in vec3 ray)
{
    float dist_traveled = 0.0;

    for (int i = 0; i < NUMBER_OF_STEPS; i++)
    {
        vec3 cur_pos = cam_pos + dist_traveled * ray;
        float dist_to_closest = sdf(cur_pos);
        if (dist_to_closest < MIN_HIT_DIST)
        {            
            return lighting(cur_pos);
        }
        if (dist_traveled > MAX_TRACE_DIST)
        {
            break;
        }
        dist_traveled += dist_to_closest;
    }
    return vec3(0.0); // hit nothing, return black.
}

vec3 reflection(in vec3 cam_pos, in vec3 ray)
{
    float reflection_c = 1.0; //eflection coefficient is initially 1
    int reflection_depth = 2; // the number of reflections, 1 means no reflection

    vec3 col = vec3(0.0);
    float dist_traveled = 0.0;
    vec3 reflect_col = vec3(0.0);
    float hit_flag = 0.0;
    vec3 cur_pos = cam_pos;

    for (int depth = 0; depth < reflection_depth; depth++)
    {
        dist_traveled = 0.0;
        reflect_col = vec3(0.0);
        hit_flag = 0.0;

        //ray marching loop
        for (int i = 0; i < NUMBER_OF_STEPS; i++)
        {
            cur_pos = cam_pos + dist_traveled * ray;
            float dist_to_closest = sdf(cur_pos);
            if (dist_to_closest < MIN_HIT_DIST)
            {            
                reflect_col = lighting(cur_pos, ray);
                hit_flag = 1.0;
            }
            if (dist_traveled > MAX_TRACE_DIST)
            {
                break;
            }
            dist_traveled += dist_to_closest;
        }

        //no object found, stop reflection
        if (hit_flag < 1.0) 
        {
           break;
        }
        
        col += reflect_col * reflection_c;
        //chaning the reflection coefficient after depth=0 color computation is done
        reflection_c = 0.1;
        //compute new reflection pos and ray 
        vec3 N = calc_norm(cur_pos);
        cam_pos = cur_pos + N * MIN_HIT_DIST;
        ray = normalize(ray - 2.0 * dot(ray, N) * N);
    }
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1) then remap to -1 to 1
    vec2 uv = (fragCoord/iResolution.xy)*2.0 - 1.0;
    vec3 cam_pos = vec3((iMouse.x/iResolution.x)*MAX_TRACE_DIST+keyboard.x, 0.0+keyboard.y, (iMouse.y/iResolution.y)*(MAX_TRACE_DIST-2.0)+1.0+keyboard.z); //our "camera" position
    // vec3 cam_pos = vec3(0.0, 0.0, 2.0);
    vec3 ray = normalize(vec3(uv, -1.0));

    vec3 col = ray_march(cam_pos, ray);

    // Output to screen
    fragColor = vec4(col,1.0);
}

void main() 
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
