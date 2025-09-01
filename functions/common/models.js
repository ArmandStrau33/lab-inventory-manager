// Minimal JS versions of the dataclasses in the spec
class LabRequest {
  constructor({id, teacher_name, teacher_email, experiment_title, materials, preferred_date, preferred_lab, notes, status}){
    this.id = id
    this.teacher_name = teacher_name
    this.teacher_email = teacher_email
    this.experiment_title = experiment_title
    this.materials = materials || []
    this.preferred_date = preferred_date || null
    this.preferred_lab = preferred_lab || null
    this.notes = notes || null
    this.status = status || 'NEW'
  }

  // Normalize materials: trim, remove empty, dedupe
  static normalizeMaterials(arr){
    if(!Array.isArray(arr)) return []
    const seen = new Set()
    return arr.map(s => (s||'').toString().trim())
      .filter(s => s.length > 0)
      .filter(s => { if(seen.has(s.toLowerCase())) return false; seen.add(s.toLowerCase()); return true })
  }

  // Create model from Firestore document data
  static fromFirestore(doc){
    if(!doc) return null
    return new LabRequest({
      id: doc.id || doc.id || null,
      teacher_name: doc.teacher_name || doc.teacherName || doc.teacher || null,
      teacher_email: doc.teacher_email || doc.teacherEmail || null,
      experiment_title: doc.experiment_title || doc.experimentTitle || doc.title || null,
      materials: Array.isArray(doc.materials) ? LabRequest.normalizeMaterials(doc.materials) : (typeof doc.materials === 'string' ? LabRequest.normalizeMaterials(doc.materials.split(',') ) : []),
      preferred_date: doc.preferred_date || doc.preferredDate || null,
      preferred_lab: doc.preferred_lab || doc.preferredLab || null,
      notes: doc.notes || null,
      status: doc.status || 'NEW'
    })
  }

  // Convert to plain object for Firestore writes
  toFirestore(){
    return {
      id: this.id,
      teacher_name: this.teacher_name,
      teacher_email: this.teacher_email,
      experiment_title: this.experiment_title,
      materials: this.materials || [],
      preferred_date: this.preferred_date || null,
      preferred_lab: this.preferred_lab || null,
      notes: this.notes || null,
      status: this.status || 'NEW',
      updated_at: new Date().toISOString()
    }
  }
}

module.exports = { LabRequest }

// TODOs:
// - Add validation helpers (toJSON, fromFirestore) for consistent serialization
// - Add helper to normalize materials (trim, dedupe)
// - Add unit tests for model transformations
// NEXT ACTION (ROADMAP):
// 1) Add `toFirestore()` normalization and ensure dates are ISO strings.
// 2) Implement `normalizeMaterials(arr)` and reuse in ingestion and inventory checks.

// NEXT ACTIONS / TODOs for `functions/common/models.js`:
// - Add unit tests for `fromFirestore` and `toFirestore` serialization paths.
// - Add stricter validation of required fields and coercion for dates.
// - Add JSDoc typedefs for better IDE support (consider migrating to TypeScript later).
// ROADMAP: small PR to add normalization helpers, then add tests.
