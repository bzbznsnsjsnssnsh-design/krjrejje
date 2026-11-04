/**
 * E2E & Production Reliability Tests:
 * NOVEL → MANGA 1.1 Master Audit & 6-Step Pipeline Verification
 */

import assert from "node:assert";
import fs from "node:fs";
import sharp from "sharp";
import {
  type StudioProductionElement,
  type StudioLocationItem,
  type StudioSceneItem,
  type AccurateReferenceState,
} from "../src/types/novelToManga";
import {
  buildCentralProductionPayload,
  buildCentralLocationPayload,
  buildCentralScenePayload,
  computeAccurateReferenceState,
  getAccurateStateBadgeInfo,
  performStrictPipelineAudit,
} from "../src/utils/masterReferenceManager";
import { geminiCookiesNovelService } from "../server/geminiCookiesNovelService";
import {
  buildReferencePdfPack,
  selectRequiredReferences,
  validatePdfPackFile,
} from "../server/referencePdfPackBuilder";

export async function runMasterAuditTests() {
  console.log("=== STARTING NOVEL → MANGA 1.1 MASTER AUDIT TESTS ===");

  // Test 1: Incomplete Description Detection
  console.log("-> Test 1: Incomplete Description State");
  const incompleteElement: StudioProductionElement = {
    id: "CHAR_001",
    entity_id: "CHAR_001",
    name: "البطل الشاب",
    element_type: "CHARACTER",
    category: "CHARACTER",
    description: "",
    visual_details: "",
    immutable_constraints: [],
    reference_lifecycle_status: "DRAFT",
    created_at: new Date().toISOString(),
  };

  const state1 = computeAccurateReferenceState(incompleteElement);
  assert.strictEqual(
    state1,
    "DESCRIPTION_INCOMPLETE",
    "Element with empty description and visual details must have DESCRIPTION_INCOMPLETE state"
  );
  const badge1 = getAccurateStateBadgeInfo(state1);
  assert.strictEqual(badge1.label, "الوصف غير مكتمل");

  // Test 2: Ready for Generation State
  console.log("-> Test 2: Description Ready for Generation State");
  const readyElement: StudioProductionElement = {
    ...incompleteElement,
    description: "محارب شاب يرتدي عباءة داكنة وسيفاً فضياً وله عينان صقريتان حادتان.",
    visual_details: "Dark cloak, silver longsword, fierce amber eyes, athletic build, flowing hair.",
    immutable_constraints: ["لا تغير لون العينين", "السيف دائماً على الجانب الأيسر"],
  };

  const state2 = computeAccurateReferenceState(readyElement);
  assert.strictEqual(
    state2,
    "DESCRIPTION_READY",
    "Element with full description must have DESCRIPTION_READY state"
  );
  const badge2 = getAccurateStateBadgeInfo(state2);
  assert.strictEqual(badge2.label, "الوصف جاهز");

  // Test 3: Central Production Generation Payload Construction
  console.log("-> Test 3: Central Generation Payload Data Integrity");
  const payload = buildCentralProductionPayload({
    element: readyElement,
    globalStyle: "Dark Fantasy Manhwa, highly detailed",
    customCorrection: "تأكيد وضع الغمد على الجانب الأيسر",
    projectId: "PROJECT_DEMO_01",
    flowProjectId: "8f3a1c20-4b99-4d8e-9a11-72b4e5f01a22",
  });

  assert.strictEqual(payload.entity_id, "CHAR_001");
  assert.strictEqual(payload.entity_name, "البطل الشاب");
  assert.strictEqual(payload.entity_type, "CHARACTER");
  assert.strictEqual(payload.project_id, "PROJECT_DEMO_01");
  assert.strictEqual(payload.flow_project_id, "8f3a1c20-4b99-4d8e-9a11-72b4e5f01a22");
  assert.ok(payload.immutable_constraints.includes("لا تغير لون العينين"));
  assert.ok(payload.master_reference_prompt.includes("Dark Fantasy Manhwa"));
  assert.ok(payload.master_reference_prompt.includes("Dark cloak"));
  assert.ok(payload.master_reference_prompt.includes("تأكيد وضع الغمد على الجانب الأيسر"));
  assert.strictEqual(payload.schema_version, "1.1");

  // Test 4: Location Central Payload Construction
  console.log("-> Test 4: Location Central Payload Construction");
  const loc: StudioLocationItem = {
    id: "LOC_001",
    location_id: "LOC_001",
    name: "قلعة الضباب الأسود",
    description: "قلعة قوطية شاهقة وسط غابة كثيفة يغلفها ضباب دائم وقمر أحمر عملاق.",
    architectural_features: ["أبراج قوطية مدببة", "بوابة حديدية سوداء ضخمة"],
    lighting: "ضوء القمر الأحمر الدامي",
    mood: "غامض ومرعب",
    immutable_rules: ["الضباب لا ينقشع أبداً", "القمر أحمر دائماً"],
    reference_lifecycle_status: "DRAFT",
    status: "DRAFT",
    created_at: new Date().toISOString(),
  };

  const locState = computeAccurateReferenceState(loc);
  assert.strictEqual(locState, "DESCRIPTION_READY");

  const locPayload = buildCentralLocationPayload({
    location: loc,
    globalStyle: "Gothic Manhwa, high contrast",
    customCorrection: "الضباب كثيف جداً عند البوابة",
    projectId: "PROJECT_DEMO_01",
    flowProjectId: "8f3a1c20-4b99-4d8e-9a11-72b4e5f01a22",
  });

  assert.strictEqual(locPayload.location_id, "LOC_001");
  assert.strictEqual(locPayload.location_name, "قلعة الضباب الأسود");
  assert.strictEqual(locPayload.location_type, "LOCATION");
  assert.ok(locPayload.environment_reference_prompt.includes("قلعة قوطية"));
  assert.ok(locPayload.environment_reference_prompt.includes("Gothic Manhwa"));
  assert.ok(locPayload.environment_reference_prompt.includes("الضباب كثيف جداً"));

  // Test 5: Image Generated & Review Lifecycle States
  console.log("-> Test 5: Image Generated and Approval Lifecycle");
  const generatedElement: StudioProductionElement = {
    ...readyElement,
    reference_image_url: "/generated/manga_storage/char_001_v1.jpg",
    reference_lifecycle_status: "GENERATED",
  };
  assert.strictEqual(computeAccurateReferenceState(generatedElement), "GENERATED");

  const reviewedElement: StudioProductionElement = {
    ...generatedElement,
    verification_result: {
      approved: false,
      issues: ["الملابس غير مطابقة"],
    },
    verification_status: "REJECTED",
  };
  assert.strictEqual(computeAccurateReferenceState(reviewedElement), "NEEDS_CORRECTION");

  const approvedElement: StudioProductionElement = {
    ...generatedElement,
    approved: true,
  };
  assert.strictEqual(computeAccurateReferenceState(approvedElement), "APPROVED");

  const lockedElement: StudioProductionElement = {
    ...approvedElement,
    locked_for_production: true,
  };
  assert.strictEqual(computeAccurateReferenceState(lockedElement), "LOCKED");

  // Test 6: Strict Pipeline Audit - No Fake 100%
  console.log("-> Test 6: Strict Pipeline Audit Verification");
  const auditIncomplete = performStrictPipelineAudit(incompleteElement, "ELEMENT");
  assert.strictEqual(auditIncomplete.overall_status, "FAIL", "Incomplete element must FAIL audit");
  assert.ok(auditIncomplete.steps.length > 0, "Audit steps must be populated");
  assert.ok(auditIncomplete.steps.some((s) => s.step === "UI" && s.status === "FAIL"));

  const auditReady = performStrictPipelineAudit(readyElement, "ELEMENT");
  assert.ok(
    auditReady.overall_status === "WARN" || auditReady.overall_status === "PASS",
    "Ready element without image should reflect realistic status (WARN pending image)"
  );
  assert.ok(auditReady.steps.length > 0);

  // Test 7: Root Cause Regression Test: validateElementLockEligibility (missing is defined)
  console.log("-> Test 7: Lock Eligibility & 'missing is not defined' Fix Verification");
  const lockCheck1 = geminiCookiesNovelService.validateElementLockEligibility(incompleteElement);
  assert.strictEqual(lockCheck1.canLock, false);
  assert.ok(Array.isArray(lockCheck1.missingRequirements), "missingRequirements must be an array");
  assert.ok(lockCheck1.missingRequirements.length > 0, "missingRequirements must identify unmet criteria");
  assert.ok(typeof lockCheck1.reasonAr === "string" && lockCheck1.reasonAr.length > 0);

  // Test 8: Central Scene Payload Construction across 6 stages
  console.log("-> Test 8: Central Scene Generation Payload Construction");
  const mockScene: StudioSceneItem = {
    scene_id: "SCENE_001",
    scene_number: 1,
    scene_order: 1,
    title: "مواجهة ليلى في وادي الرياح",
    description: "تقف ليلى حاملة سيف النجم الفضي في وادي الرياح المتجمد وتواجه العاصفة.",
    scene_text: "تقف ليلى حاملة سيف النجم الفضي في وادي الرياح المتجمد وتواجه العاصفة.",
    characters: ["ليلى"],
    character_ids: ["CHAR_001"],
    weapons: ["سيف النجم الفضي"],
    primary_location_id: "LOC_001",
    location_name: "وادي الرياح",
    aspect_ratio: "16:9",
    approved: false,
    generation_status: "WAITING",
    created_at: new Date().toISOString(),
  };

  const scenePayload = buildCentralScenePayload({
    scene: mockScene,
    globalStyle: "Dark Fantasy Manhwa, cinematic lighting",
    elements: [
      {
        ...readyElement,
        id: "CHAR_001",
        name: "ليلى",
        category: "CHARACTER",
        clothing_and_armor: "عباءة صوفية داكنة مع درع جلدي",
        expressions_and_poses: "نظرة حاسمة وقفة قتالية ثابتة",
      },
      {
        id: "WEAP_001",
        name: "سيف النجم الفضي",
        category: "WEAPON",
        attached_to: "CHAR_001",
      } as any,
      {
        id: "CHAR_999",
        name: "وحش العناكب غير المستخدم في المشهد",
        category: "CREATURE",
      } as any,
    ],
    locations: [
      {
        ...loc,
        location_id: "LOC_001",
        name: "وادي الرياح",
        type: "VALLEY",
      },
    ],
    customCorrection: "اجعل لون العباءة أزرق داكن",
    imageProvider: "Duck.ai",
  });

  assert.strictEqual(scenePayload.scene_id, "SCENE_001");
  assert.strictEqual(scenePayload.location_id, "LOC_001");
  assert.strictEqual(scenePayload.generation_provider, "Duck.ai");
  assert.strictEqual(scenePayload.characters.length, 1);
  assert.strictEqual(scenePayload.characters[0].name, "ليلى");
  assert.strictEqual(scenePayload.weapons_and_items.length, 1);
  assert.strictEqual(scenePayload.weapons_and_items[0].name, "سيف النجم الفضي");
  assert.ok(scenePayload.final_scene_prompt.includes("ليلى"));
  assert.ok(scenePayload.final_scene_prompt.includes("سيف النجم الفضي"));
  assert.ok(scenePayload.final_scene_prompt.includes("وادي الرياح"));
  assert.ok(scenePayload.final_scene_prompt.includes("اجعل لون العباءة أزرق داكن"));
  assert.ok(!scenePayload.final_scene_prompt.includes("وحش العناكب"));

  // Test 9: Reference PDF Pack Selection & Unused Entities Exclusion
  console.log("-> Test 9: Reference Selection & Exclusion Logic");
  const testRefImg = "public/manga_storage/test_audit_ref.jpg";
  const dummyImgBuf = await sharp({
    create: { width: 500, height: 700, channels: 3, background: { r: 60, g: 100, b: 180 } },
  })
    .jpeg()
    .toBuffer();
  fs.writeFileSync(testRefImg, dummyImgBuf);

  const selection = selectRequiredReferences({
    targetType: "SCENE",
    targetId: "SCENE_001",
    targetTitle: mockScene.title,
    elements: [
      {
        id: "CHAR_001",
        name: "ليلى",
        category: "CHARACTER",
        reference_image_url: "/manga_storage/test_audit_ref.jpg",
        locked_for_production: true,
      } as any,
      {
        id: "WEAP_001",
        name: "سيف النجم الفضي",
        category: "WEAPON",
        attached_to: "CHAR_001",
        reference_image_url: "/manga_storage/test_audit_ref.jpg",
        locked_for_production: true,
      } as any,
      {
        id: "MONSTER_001",
        name: "عنكبوت الكهف غير المستخدم",
        category: "CREATURE",
        reference_image_url: "/manga_storage/test_audit_ref.jpg",
        locked_for_production: true,
      } as any,
    ],
    locations: [
      {
        location_id: "LOC_001",
        name: "وادي الرياح",
        reference_image_url: "/manga_storage/test_audit_ref.jpg",
        locked_for_production: true,
      } as any,
      {
        location_id: "LOC_999",
        name: "بوابة الموت غير المستخدمة",
        reference_image_url: "/manga_storage/test_audit_ref.jpg",
        locked_for_production: true,
      } as any,
    ],
    scene: mockScene,
  });

  assert.ok(selection.selectedItems.some((s) => s.entity_id === "CHAR_001"), "CHAR_001 must be selected");
  assert.ok(selection.selectedItems.some((s) => s.entity_id === "LOC_001"), "LOC_001 must be selected");
  assert.ok(!selection.selectedItems.some((s) => s.entity_id === "MONSTER_001"), "MONSTER_001 must be excluded");
  assert.ok(!selection.selectedItems.some((s) => s.entity_id === "LOC_999"), "LOC_999 must be excluded");

  // Test 10: Reference PDF Pack Generation & Header Verification
  console.log("-> Test 10: Reference PDF Pack Builder & Header Verification");
  const pdfBuildRes = await buildReferencePdfPack({
    targetType: "SCENE",
    targetId: "SCENE_001",
    targetTitle: mockScene.title,
    elements: [
      {
        id: "CHAR_001",
        name: "ليلى",
        category: "CHARACTER",
        reference_image_url: "/manga_storage/test_audit_ref.jpg",
        locked_for_production: true,
      } as any,
    ],
    locations: [
      {
        location_id: "LOC_001",
        name: "وادي الرياح",
        reference_image_url: "/manga_storage/test_audit_ref.jpg",
        locked_for_production: true,
      } as any,
    ],
    scene: mockScene,
  });

  assert.strictEqual(pdfBuildRes.success, true, "PDF build must succeed");
  assert.ok(pdfBuildRes.manifest, "Manifest must exist");
  assert.strictEqual(pdfBuildRes.manifest.total_pages, 2, "Must have exactly 2 pages (Layla + Valley)");
  assert.strictEqual(pdfBuildRes.manifest.pdf_header_verified, true, "Header must be %PDF- verified");
  assert.ok(fs.existsSync(pdfBuildRes.manifest.file_path), "PDF file must exist on disk");

  const fileValidation = validatePdfPackFile(pdfBuildRes.manifest.file_path, 2);
  assert.strictEqual(fileValidation.isValid, true, "File on disk must validate cleanly");

  console.log("=== ALL NOVEL → MANGA 1.1 MASTER AUDIT TESTS PASSED (10/10) ===");
  return { success: true };
}

// Auto-run if executed directly
if (process.argv[1]?.includes("novelToMangaMasterAudit.test")) {
  runMasterAuditTests()
    .then(() => {
      console.log("SUCCESS: Master audit test suite finished cleanly.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("FAIL: Master audit test suite failed:", err);
      process.exit(1);
    });
}
