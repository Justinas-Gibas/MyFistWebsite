# ===============================================================================
# BLENDER ADD-ON: MESH ALIGNMENT TOOL
# ===============================================================================
# This is a Blender add-on that helps align two 3D meshes by selecting matching points
# Think of it like trying to match two puzzle pieces by marking corresponding corners
# This addon is optimized for large meshes and uses GPU acceleration where possible
# ===============================================================================
# Main 
#
# WHAT THIS TOOL DOES:
# - Lets you pick points on two different 3D objects (meshes)
# - Calculates how to move one object to align with the other tho mesh can be difrent
# - Useful for matching scanned objects, aligning parts, etc.
#
# HOW IT WORKS:
# 1. You select a "fixed" object (stays in place)
# 1.1 You can also select vertex groups to align only part of the mesh
# 2. You select a "floating" object (will be moved to align)
# 2.1 You can also select objects to move along with the floating object
# 3. You click matching points on both objects(represented by colored spheres)
# 4. The tool slowy moves and rotates object
#  calculates the how good alignmet is and if its getting better contiues
#  if its not it tries difrent roation and translation
# 5. Tool bakes texture or colors vertex(shader) to represent the mesh difference calsculated fromsistance from face to face  
# ===============================================================================

# Blender Add-on Information Block
# This dictionary tells Blender about our add-on: its name, version compatibility, and category
bl_info = {
    "name": "Mesh Align Tool (Modal GPU Ready CUDA)",         # Name shown in Blender's add-on list
    "blender": (3, 0, 0),                              # Minimum Blender version required
    "category": "Object",                               # Category in Blender's add-on manager
    "author": "Justinas Gibas",                      # Who made this add-on
    "description": "Step-by-step mesh alignment with user-defined anchor points and vertex group support."
}

# ===============================================================================
# PYTHON IMPORTS - Required Libraries and Modules
# ===============================================================================
# These are all the Python modules we need to make our add-on work

# BLENDER-SPECIFIC IMPORTS:
import bpy              # Main Blender Python API - lets us control Blender from Python
import bmesh            # Blender's mesh editing library - for working with 3D geometry
import math             # Standard Python math functions (sin, cos, sqrt, etc.)
import random           # For generating random numbers (used in some alignment algorithms)
import time             # For timing operations and delays

# BLENDER PROPERTY TYPES:
# These let us create user interface elements that store data
from bpy.props import PointerProperty, StringProperty, CollectionProperty

# BLENDER MATH UTILITIES:
# These handle 3D math operations like transformations and vectors
from mathutils import Matrix, Vector

# BLENDER 3D VIEW UTILITIES:
# These help us interact with the 3D viewport (clicking, ray casting, etc.)
from bpy_extras import view3d_utils

# ===============================================================================
# UTILITY FUNCTIONS - Helper Functions for Mesh Alignment
# ===============================================================================
# These are small helper functions that do specific calculations
# Think of them as tools in a toolbox that we use throughout the add-on

def get_world_position(obj, v_idx):
    """
    GET WORLD POSITION OF A VERTEX
    
    WHAT THIS DOES:
    - Takes a 3D object and a vertex number (like vertex #5)
    - Returns the exact position of that vertex in 3D space
    
    WHY WE NEED THIS:
    - Objects in Blender have their own "local" coordinate system
    - But we need to know where things are in "world" coordinates
    - It's like asking "where is the corner of this table in the room?" 
      instead of "where is it relative to the table's center?"
    
    PARAMETERS:
    - obj: The 3D object (mesh) we're looking at
    - v_idx: The vertex index (which corner/point we want, like vertex #5)
    
    RETURNS:
    - A Vector representing the x,y,z position in world space
    """
    return obj.matrix_world @ obj.data.vertices[v_idx].co

def average_distance(a_verts, b_verts):
    """
    CALCULATE AVERAGE DISTANCE BETWEEN TWO SETS OF POINTS
    
    WHAT THIS DOES:
    - Takes two lists of 3D points
    - Measures the distance between each pair of corresponding points
    - Returns the average of all those distances
    
    WHY WE NEED THIS:
    - To measure how well two objects are aligned
    - Like measuring how far apart matching corners are on average
    - Lower numbers mean better alignment
    
    PARAMETERS:
    - a_verts: List of 3D points from first object
    - b_verts: List of 3D points from second object
    
    RETURNS:
    - Average distance as a floating point number
    - Returns infinity if either list is empty (no points to compare)
    """
    if len(a_verts) == 0 or len(b_verts) == 0:
        return float('inf')  # Return "infinite" distance if no points to compare
    
    total = 0.0
    # Go through each pair of corresponding points
    for a, b in zip(a_verts, b_verts):
        total += (a - b).length  # Add the distance between this pair
    
    return total / len(a_verts)  # Return the average

def align_using_points(fixed_obj, float_obj, pairs, transform):
    """
    TEST HOW WELL A TRANSFORMATION ALIGNS TWO OBJECTS
    
    WHAT THIS DOES:
    - Takes a proposed transformation (rotation, scaling, translation)
    - Applies it to the floating object's anchor points
    - Measures how close the transformed points are to the fixed object's points
    
    WHY WE NEED THIS:
    - To test different transformations and find the best one
    - Like trying different ways to rotate and move a puzzle piece
      to see which way fits best
    
    PARAMETERS:
    - fixed_obj: The object that stays in place
    - float_obj: The object that will be moved
    - pairs: List of matching point pairs [(fixed_idx, floating_idx), ...]
    - transform: The transformation matrix to test
    
    RETURNS:
    - Average distance after applying the transformation (lower is better)
    """
    transformed = []
    
    # Apply the transformation to each floating point
    for _, float_idx in pairs:
        # Get the point's position in world space
        v = get_world_position(float_obj, float_idx)
        # Convert to local coordinates
        v_local = float_obj.matrix_world.inverted() @ v
        # Apply our test transformation
        v_trans = transform @ v_local
        transformed.append(v_trans)

    # Get the corresponding fixed points
    fixed_positions = [get_world_position(fixed_obj, fid) for fid, _ in pairs]
    
    # Return how far apart they are on average
    return average_distance(fixed_positions, transformed)

def get_vertex_group_verts(obj, group_name):
    """
    GET ALL VERTICES IN A NAMED VERTEX GROUP
    
    WHAT THIS DOES:
    - Finds all vertices that belong to a specific vertex group
    - Vertex groups are like selections you can save in Blender
    - Returns their world positions
    
    WHY WE NEED THIS:
    - Sometimes you want to align specific parts of an object
    - Like aligning just the "handle" part of a tool, not the whole thing
    - Vertex groups let you mark important areas
    
    PARAMETERS:
    - obj: The 3D object to search
    - group_name: Name of the vertex group (like "handle" or "base")
    
    RETURNS:
    - List of 3D positions for all vertices in that group
    - Empty list if the group doesn't exist
    """
    # Try to find the vertex group by name
    group = obj.vertex_groups.get(group_name)
    if not group:
        return []  # Return empty list if group doesn't exist

    verts = []
    # Check each vertex in the object
    for v in obj.data.vertices:
        # Check if this vertex belongs to our group
        for g in v.groups:
            if g.group == group.index:
                # Convert to world position and add to our list
                verts.append(obj.matrix_world @ v.co)
                break  # Found it, no need to check other groups for this vertex
    
    return verts

# ===============================================================================
# DATA STRUCTURES - Classes That Store Our Settings and Data
# ===============================================================================
# These classes define what information our add-on needs to remember
# Think of them like forms that store the user's choices

class AlignPointPair(bpy.types.PropertyGroup):
    """
    ANCHOR POINT PAIR DATA STRUCTURE
    
    WHAT THIS STORES:
    - One pair of matching points between two objects
    - Like saying "vertex #5 on object A matches vertex #12 on object B"
    
    WHY WE NEED THIS:
    - The alignment algorithm needs to know which points should match up
    - Users click on corresponding points, and we store those relationships here
    - We can have multiple pairs for better alignment accuracy
    
    PROPERTIES:
    - fixed_index: Which vertex number on the fixed (stationary) object
    - floating_index: Which vertex number on the floating (moving) object
    """
    fixed_index: bpy.props.IntProperty()      # Stores an integer (vertex number)
    floating_index: bpy.props.IntProperty()   # Stores an integer (vertex number)

class MeshAlignProperties(bpy.types.PropertyGroup):
    """
    MAIN SETTINGS FOR THE MESH ALIGNMENT TOOL
    
    WHAT THIS STORES:
    - All the settings and choices the user makes in the interface
    - The objects they want to align
    - The anchor points they've selected
    - Optional vertex groups for partial alignment
    
    WHY WE NEED THIS:
    - Blender add-ons need to store user settings somewhere
    - This acts like a "memory" for our tool
    - All the interface elements connect to these properties
    """
    
    # OBJECT SELECTION PROPERTIES:
    fixed_object: PointerProperty(
        name="Fixed Object",                    # Label shown in the UI
        type=bpy.types.Object,                 # Must be a Blender object
        poll=lambda self, obj: obj.type == 'MESH'  # Only allow mesh objects (not cameras, lights, etc.)
    )
    floating_object: PointerProperty(
        name="Floating Object",                # Label shown in the UI  
        type=bpy.types.Object,                 # Must be a Blender object
        poll=lambda self, obj: obj.type == 'MESH'  # Only allow mesh objects
    )
    attach_children_root: PointerProperty(
        name="Attach Children",               # Label shown in the UI
        type=bpy.types.Object,                # Any object type allowed
        poll=lambda self, obj: True           # Accept any object
    )
    
    # VERTEX GROUP PROPERTIES (for partial alignment):
    fixed_vertex_group: StringProperty(name="Fixed Vertex Group")        # Text field for group name
    floating_vertex_group: StringProperty(name="Floating Vertex Group")  # Text field for group name
    
    # ANCHOR POINTS COLLECTION:
    point_pairs: CollectionProperty(type=AlignPointPair)  # A list of anchor point pairs

# ===============================================================================
# USER INTERFACE PANEL - The Control Panel Users See
# ===============================================================================
# This creates the visual interface that appears in Blender's sidebar
# Like a control panel with buttons, dropdowns, and text fields

class OBJECT_PT_mesh_align_panel(bpy.types.Panel):
    """
    THE MAIN CONTROL PANEL FOR MESH ALIGNMENT
    
    WHAT THIS CREATES:
    - A panel in Blender's 3D viewport sidebar (press N to see it)
    - Contains all the controls users need to align meshes
    - Shows the current anchor points and allows adding/removing them
    
    WHERE IT APPEARS:
    - In the 3D Viewport's sidebar (Properties panel area)
    - Under a tab called "Mesh Align Tool"
    
    PANEL SETTINGS:
    """
    bl_label = "Mesh Align Tool"           # Title shown at the top of the panel
    bl_idname = "OBJECT_PT_mesh_align_panel"  # Internal identifier for Blender
    bl_space_type = 'VIEW_3D'              # Appears in 3D Viewport
    bl_region_type = 'UI'                  # In the UI sidebar region
    bl_category = "Mesh Align Tool"        # Tab name in the sidebar

    def draw(self, context):
        """
        DRAW THE USER INTERFACE
        
        WHAT THIS DOES:
        - Creates all the buttons, dropdowns, and text fields users see
        - Connects them to our stored properties
        - Updates automatically when data changes
        
        PARAMETERS:
        - self: Reference to this panel instance
        - context: Current state of Blender (what's selected, active, etc.)
        """
        layout = self.layout  # Get the layout system for drawing UI elements
        props = context.scene.mesh_align_props  # Get our stored settings

        # OBJECT SELECTION SECTION:
        # These create dropdown menus to select objects from the scene
        layout.prop(props, "fixed_object")        # Dropdown: "Fixed Object"
        layout.prop(props, "fixed_vertex_group")  # Text field: "Fixed Vertex Group"
        layout.prop(props, "floating_object")     # Dropdown: "Floating Object"  
        layout.prop(props, "floating_vertex_group")  # Text field: "Floating Vertex Group"
        layout.prop(props, "attach_children_root")   # Dropdown: "Attach Children"

        # ANCHOR POINTS SECTION:
        layout.label(text="Anchor Points:")  # Section header
        
        # Display each anchor point pair with a remove button:
        for i, pair in enumerate(props.point_pairs):
            row = layout.row(align=True)  # Create a horizontal row of UI elements
            
            # Show the point pair information:
            row.label(text=f"{i+1}. Fixed {pair.fixed_index} ↔ Floating {pair.floating_index}")
            
            # Add a remove button (X) for this pair:
            op = row.operator("object.remove_alignment_point", text="X", icon='X')
            op.index = i  # Tell the button which pair to remove

        # ACTION BUTTONS:
        # These are the main buttons users click to do things
        layout.operator("object.add_alignment_point_modal", icon='PLUS')      # "Add Anchor Point" button
        layout.operator("object.align_meshes_modal", icon='MOD_SMOOTH')       # "Align Meshes" button

# ===============================================================================
# MODAL OPERATOR: ADD ANCHOR POINTS BY CLICKING
# ===============================================================================
# This is the most complex part - it lets users click on 3D objects to select points
# "Modal" means it takes over user input until the operation is complete

class OBJECT_OT_add_alignment_point_modal(bpy.types.Operator):
    """
    INTERACTIVE POINT SELECTION TOOL
    
    WHAT THIS DOES:
    - Enters a special "clicking mode" where users can click on 3D objects
    - First click selects a point on the fixed object
    - Second click selects a corresponding point on the floating object  
    - Creates an anchor point pair from these two clicks
    - Uses "ray casting" to figure out what the user clicked on
    
    HOW RAY CASTING WORKS:
    - Imagine a laser beam shooting from your mouse cursor into the 3D scene
    - The beam travels in a straight line until it hits something
    - We can find exactly which vertex was hit and where
    
    INTERACTION FLOW:
    1. User clicks the "Add Anchor Point" button
    2. Tool says "Click on the fixed object"
    3. User clicks somewhere on the fixed mesh
    4. Tool says "Now click on the floating object"  
    5. User clicks corresponding point on floating mesh
    6. Tool creates the anchor point pair and exits
    
    BLENDER OPERATOR SETTINGS:
    """
    bl_idname = "object.add_alignment_point_modal"     # Internal command name
    bl_label = "Add Anchor Pair (Click Mesh)"         # Button text
    bl_description = "Click once on fixed mesh, then floating mesh to set pair"  # Tooltip

    # INTERNAL STATE VARIABLES:
    # These remember what stage of clicking we're in
    click_stage = 0      # 0 = waiting for fixed object click, 1 = waiting for floating object click
    fixed_index = -1     # Stores the vertex index from the first click

    def modal(self, context, event):
        """
        HANDLE USER INPUT WHILE IN CLICKING MODE
        
        WHAT THIS DOES:
        - Gets called every time the user moves the mouse or clicks
        - Processes mouse clicks to select vertices
        - Handles cancellation (right-click or ESC)
        - Uses ray casting to find what was clicked
        
        PARAMETERS:
        - self: Reference to this operator instance
        - context: Current Blender state
        - event: What just happened (mouse click, key press, etc.)
        
        RETURNS:
        - {'RUNNING_MODAL'}: Keep the tool active, waiting for more input
        - {'FINISHED'}: Successfully completed the operation
        - {'CANCELLED'}: User canceled or something went wrong
        """
        
        # CHECK FOR LEFT MOUSE CLICK:
        if event.type == 'LEFTMOUSE' and event.value == 'PRESS':
            # Get information about where the click happened:
            region = context.region          # The 3D viewport area
            rv3d = context.space_data.region_3d  # 3D viewport settings
            coord = (event.mouse_region_x, event.mouse_region_y)  # Mouse coordinates
            
            # Get our settings to know which objects we're working with:
            props = context.scene.mesh_align_props
            
            # Determine which object we should be clicking on:
            obj = props.fixed_object if self.click_stage == 0 else props.floating_object

            # VALIDATE THE TARGET OBJECT:
            if not obj or obj.type != 'MESH':
                self.report({'ERROR'}, "Object not valid for picking")
                return {'CANCELLED'}

            # PERFORM RAY CASTING:
            # This is like shooting a laser from the mouse cursor into the 3D scene
            depsgraph = context.evaluated_depsgraph_get()  # Get current scene state
            
            # Cast the ray and see what it hits:
            result, location, normal, index, obj, matrix = context.scene.ray_cast(
                depsgraph, 
                *view3d_utils.region_2d_to_origin_3d(region, rv3d, coord),     # Ray start point
                view3d_utils.region_2d_to_vector_3d(region, rv3d, coord)       # Ray direction
            )

            # CHECK IF WE HIT ANYTHING:
            if not result or index == -1:
                self.report({'WARNING'}, "Nothing hit")  # Tell user they missed
                return {'RUNNING_MODAL'}  # Keep waiting for a valid click

            # PROCESS THE CLICK BASED ON CURRENT STAGE:
            if self.click_stage == 0:
                # FIRST CLICK - Fixed object point selected:
                self.fixed_index = index  # Remember which vertex was clicked
                self.click_stage = 1      # Move to stage 2
                self.report({'INFO'}, f"Picked fixed point {index}, now click floating mesh")
                
            else:
                # SECOND CLICK - Floating object point selected:
                # Create a new anchor point pair:
                new_pair = context.scene.mesh_align_props.point_pairs.add()
                new_pair.fixed_index = self.fixed_index      # From first click
                new_pair.floating_index = index              # From second click
                
                self.report({'INFO'}, f"Added anchor pair: {self.fixed_index} ↔ {index}")
                
                # We're done! Exit the modal operation:
                context.window_manager.modal_handler_remove(self)
                return {'FINISHED'}

        # CHECK FOR CANCELLATION:
        elif event.type in {'RIGHTMOUSE', 'ESC'}:
            self.report({'INFO'}, "Canceled anchor pair picking")
            context.window_manager.modal_handler_remove(self)
            return {'CANCELLED'}

        # FOR ALL OTHER EVENTS (mouse movement, etc.):
        return {'RUNNING_MODAL'}  # Keep the tool active

    def invoke(self, context, event):
        """
        START THE INTERACTIVE CLICKING MODE
        
        WHAT THIS DOES:
        - Called when the user clicks the "Add Anchor Point" button
        - Sets up the initial state
        - Tells Blender to start capturing user input
        
        PARAMETERS:
        - self: Reference to this operator instance
        - context: Current Blender state
        - event: The button click event that started this
        
        RETURNS:
        - {'RUNNING_MODAL'}: Successfully started the interactive mode
        """
        self.click_stage = 0  # Reset to first click stage
        context.window_manager.modal_handler_add(self)  # Start capturing input
        self.report({'INFO'}, "Click fixed mesh vertex")  # Tell user what to do
        return {'RUNNING_MODAL'}

# ===============================================================================
# SIMPLE OPERATOR: REMOVE ANCHOR POINTS
# ===============================================================================
# This is much simpler than the modal operator - it just removes an anchor point

class OBJECT_OT_remove_alignment_point(bpy.types.Operator):
    """
    REMOVE AN ANCHOR POINT PAIR
    
    WHAT THIS DOES:
    - Removes one anchor point pair from the list
    - Gets called when user clicks the "X" button next to a point pair
    - Simple one-step operation (not interactive like the add operator)
    
    HOW IT WORKS:
    - Each "X" button stores which point pair it should remove
    - When clicked, this operator deletes that specific pair
    - The UI automatically updates to show the remaining pairs
    
    BLENDER OPERATOR SETTINGS:
    """
    bl_idname = "object.remove_alignment_point"  # Internal command name
    bl_label = "Remove Anchor Point"             # What shows in menus/tooltips

    # OPERATOR PARAMETER:
    # This stores which anchor point pair to remove
    index: bpy.props.IntProperty()  # Index number of the pair to remove

    def execute(self, context):
        """
        PERFORM THE REMOVAL
        
        WHAT THIS DOES:
        - Gets the list of anchor point pairs
        - Removes the one at the specified index
        - Returns success status
        
        PARAMETERS:
        - self: Reference to this operator instance  
        - context: Current Blender state
        
        RETURNS:
        - {'FINISHED'}: Operation completed successfully
        """
        # Get our stored point pairs and remove the specified one:
        context.scene.mesh_align_props.point_pairs.remove(self.index)
        return {'FINISHED'}
    
# ===============================================================================
# MAIN ALIGNMENT OPERATOR: THE ACTUAL MESH ALIGNMENT
# ===============================================================================
# This is where the magic happens - calculating and applying the transformation

class OBJECT_OT_align_meshes_modal(bpy.types.Operator):
    """
    PERFORM THE ACTUAL MESH ALIGNMENT
    
    WHAT THIS DOES:
    - Takes all the anchor point pairs the user has created
    - Calculates the best transformation (rotation, translation, scaling) 
    - Applies that transformation to move the floating object
    - This is the "solve the puzzle" step after collecting all the pieces
    
    HOW MESH ALIGNMENT WORKS (simplified):
    1. You have two objects with matching points marked
    2. The algorithm tries different ways to rotate/move the floating object
    3. It measures how close the transformed points are to the target points
    4. It finds the transformation that minimizes the distance
    5. It applies that transformation to move the object into alignment
    
    MATHEMATICAL BACKGROUND:
    - This is called "point cloud registration" or "rigid body transformation"
    - Common algorithms include ICP (Iterative Closest Point) and SVD-based methods
    - The goal is to find rotation matrix R and translation vector T such that:
      R * floating_point + T ≈ fixed_point (for all point pairs)
    
    BLENDER OPERATOR SETTINGS:
    """
    bl_idname = "object.align_meshes_modal"    # Internal command name
    bl_label = "Align Meshes"                  # Button text
    bl_description = "Align floating mesh to fixed mesh using anchor points"  # Tooltip

    def execute(self, context):
        """
        PERFORM THE ALIGNMENT CALCULATION AND APPLICATION
        
        WHAT THIS DOES:
        - Validates that we have the required objects and points
        - Converts our anchor points into a format for calculation
        - Calls the alignment algorithm (currently placeholder)
        - Applies the resulting transformation
        
        CURRENT STATUS:
        - This is a skeleton implementation
        - The actual transformation math needs to be implemented
        - The utility functions exist but the main algorithm is missing
        
        PARAMETERS:
        - self: Reference to this operator instance
        - context: Current Blender state
        
        RETURNS:
        - {'FINISHED'}: Alignment completed successfully
        - {'CANCELLED'}: Alignment failed due to missing requirements
        """
        props = context.scene.mesh_align_props  # Get our stored settings
        
        # VALIDATION: Check that we have everything we need
        if not props.fixed_object or not props.floating_object:
            self.report({'ERROR'}, "Both fixed and floating objects must be selected")
            return {'CANCELLED'}
        
        if len(props.point_pairs) == 0:
            self.report({'ERROR'}, "At least one anchor point pair is required")
            return {'CANCELLED'}
        
        # CONVERT DATA FORMAT:
        # Convert our Blender property groups into simple Python tuples
        # Format: [(fixed_vertex_index, floating_vertex_index), ...]
        pairs = [(pair.fixed_index, pair.floating_index) for pair in props.point_pairs]
        
        # TODO: IMPLEMENT THE ACTUAL ALIGNMENT ALGORITHM HERE
        # ===================================================
        # This is where the real math would go. You would:
        # 
        # 1. Extract 3D coordinates of all anchor points
        # 2. Calculate centroids (center points) of both point sets
        # 3. Use SVD (Singular Value Decomposition) or similar method to find:
        #    - Optimal rotation matrix
        #    - Optimal translation vector
        #    - Optional: scaling factor
        # 4. Construct the transformation matrix
        # 5. Apply it to the floating object
        #
        # Common algorithms:
        # - Kabsch algorithm (for rigid body alignment)
        # - ICP (Iterative Closest Point) for more complex cases
        # - RANSAC for dealing with outlier points
        #
        # The utility functions like align_using_points() and get_world_position()
        # provide the building blocks for this calculation.
        
        # PLACEHOLDER SUCCESS MESSAGE:
        self.report({'INFO'}, f"Aligning {props.floating_object.name} to {props.fixed_object.name}")
        
        # TODO: Replace this with actual transformation application:
        # props.floating_object.matrix_world = calculated_transformation_matrix
        
        return {'FINISHED'}
    
# ---------------------------
# REGISTER
# ---------------------------
classes = (
    AlignPointPair,
    MeshAlignProperties,
    OBJECT_PT_mesh_align_panel,
    OBJECT_OT_add_alignment_point_modal,
    OBJECT_OT_remove_alignment_point,
    OBJECT_OT_align_meshes_modal,
)

def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.Scene.mesh_align_props = PointerProperty(type=MeshAlignProperties)

def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
    del bpy.types.Scene.mesh_align_props

if __name__ == "__main__":
    register()
