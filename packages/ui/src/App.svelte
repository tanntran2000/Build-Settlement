<script lang="ts">
  import { createNamedCharacter, createDefaultInventory, type Settlement } from '@haven/core';
  import { simulateDailyEconomy } from '@haven/simulation';
  import { Content } from '@haven/content';

  // State khởi tạo thử nghiệm lãnh địa đầu tiên
  let lan = createNamedCharacter({
    id: "char_lan",
    name: "Lan",
    gender: "female",
    age: 23,
    occupation: "technician",
    socialClass: "skilled",
    legalStatus: "citizen",
  });

  let currentSettlement: Settlement = {
    id: "settlement_haven_01",
    name: "Lãnh địa Khởi nguyên (Haven Alpha)",
    status: "active",
    dayCreated: 1,
    authority: 65,
    reputation: 80,
    inventory: createDefaultInventory(),
    namedCharacters: [lan],
    cohorts: [
      {
        id: "cohort_workers",
        occupation: "worker",
        legalStatus: "citizen",
        count: 45,
        averageHealth: 85,
        morale: 75,
        productivity: 80,
        resentment: 5,
        loyalty: 80,
        livingStandard: "decent",
      }
    ],
    facilities: [
      {
        id: "fac_shelter",
        name: "Khu trú ẩn cơ bản",
        type: "housing",
        level: 1,
        stage: "operational",
        capacity: 50,
        assignedWorkerCount: 0,
      }
    ]
  };

  let day = 1;
  let log: string[] = ["Bắt đầu khai phá vùng đất mới từ con số 0."];

  function handleNextDay() {
    day += 1;
    const report = simulateDailyEconomy(currentSettlement);
    
    // Áp dụng delta tài nguyên
    report.netDeltas.forEach(effect => {
      if (effect.type === "RESOURCE_DELTA") {
        currentSettlement.inventory[effect.resource] += effect.delta;
        log.unshift(`[Ngày ${day}] ${effect.reason}: ${effect.delta > 0 ? '+' : ''}${effect.delta} ${effect.resource}`);
      }
    });
    
    currentSettlement = { ...currentSettlement };
  }
</script>

<main style="max-width: 1200px; margin: 0 auto; padding: 24px;">
  <!-- Header Bar -->
  <header class="card" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
    <div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <h1 style="font-size: 1.5rem; font-weight: 700; color: #fff;">{currentSettlement.name}</h1>
        <span class="badge badge-active">{currentSettlement.status}</span>
      </div>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 4px;">
        Ngày: <strong style="color: var(--accent-gold);">{day}</strong> | 
        Quyền lực cưỡng chế: <strong style="color: var(--accent-blue);">{currentSettlement.authority}</strong> | 
        Uy tín chính danh: <strong style="color: var(--accent-green);">{currentSettlement.reputation}</strong>
      </p>
    </div>
    <div>
      <button 
        onclick={handleNextDay}
        style="background: var(--accent-green); color: #000; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer;">
        Tiến Sang Ngày Mới ➔
      </button>
    </div>
  </header>

  <!-- Dashboard Grid -->
  <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
    <!-- Left Column: Territory & People -->
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- Kho Tài nguyên -->
      <section class="card">
        <h2 style="font-size: 1.1rem; margin-bottom: 12px; color: #fff;">Kho Dự trữ Tài nguyên Lãnh địa</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
          <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px;">
            <div style="color: var(--text-muted); font-size: 0.8rem;">Lương thực</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-green);">{currentSettlement.inventory.food}</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px;">
            <div style="color: var(--text-muted); font-size: 0.8rem;">Nước sạch</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-blue);">{currentSettlement.inventory.clean_water}</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px;">
            <div style="color: var(--text-muted); font-size: 0.8rem;">Vật liệu xây dựng</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-gold);">{currentSettlement.inventory.building_materials}</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px;">
            <div style="color: var(--text-muted); font-size: 0.8rem;">Thuốc men</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #ff7b72;">{currentSettlement.inventory.medicine}</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px;">
            <div style="color: var(--text-muted); font-size: 0.8rem;">Công cụ</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #d2a8ff;">{currentSettlement.inventory.tools}</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px;">
            <div style="color: var(--text-muted); font-size: 0.8rem;">Ngân khố</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #79c0ff;">{currentSettlement.inventory.currency}</div>
          </div>
        </div>
      </section>

      <!-- Nhân vật Cốt lõi (Named NPC) -->
      <section class="card">
        <h2 style="font-size: 1.1rem; margin-bottom: 12px; color: #fff;">Nhân sự Chủ chốt (Named NPC)</h2>
        <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="font-size: 1.1rem; color: #fff; font-weight: 600;">{lan.name}, {lan.age} tuổi</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted);">
                Nghề: <span style="color: var(--accent-blue); font-weight: 500;">{lan.occupation}</span> | 
                Tầng lớp: <span style="color: var(--accent-gold);">{lan.socialClass}</span> | 
                Địa vị: <span style="color: var(--accent-green);">{lan.legalStatus}</span>
              </p>
            </div>
            <div style="text-align: right;">
              <span class="badge" style="background: rgba(88, 166, 255, 0.2); color: var(--accent-blue);">Sức khỏe: {lan.health}%</span>
            </div>
          </div>

          <!-- 8D Relationship preview -->
          <div style="margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 12px;">
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">Quan hệ 8 chiều với Người chơi:</div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 0.8rem;">
              <div>Tin tưởng: <strong>{lan.relationshipToPlayer.trust}</strong></div>
              <div>Tình cảm: <strong>{lan.relationshipToPlayer.affection}</strong></div>
              <div>Tôn trọng: <strong>{lan.relationshipToPlayer.respect}</strong></div>
              <div>Sợ hãi: <strong>{lan.relationshipToPlayer.fear}</strong></div>
              <div>Sức hút: <strong>{lan.relationshipToPlayer.attraction}</strong></div>
              <div>Oán hận: <strong>{lan.relationshipToPlayer.resentment}</strong></div>
              <div>Phụ thuộc: <strong>{lan.relationshipToPlayer.dependency}</strong></div>
              <div>Thân thuộc: <strong>{lan.relationshipToPlayer.familiarity}</strong></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Dân số Quần thể (Cohort) -->
      <section class="card">
        <h2 style="font-size: 1.1rem; margin-bottom: 12px; color: #fff;">Quần thể Dân cư (Population Cohorts)</h2>
        {#each currentSettlement.cohorts as cohort}
          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary); padding: 12px; border-radius: 6px;">
            <div>
              <strong>Nhóm Công nhân Khai hoang</strong> ({cohort.count} người)
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                Địa vị: {cohort.legalStatus} | Mức sống: {cohort.livingStandard}
              </div>
            </div>
            <div style="text-align: right; font-size: 0.85rem;">
              Sĩ khí: <span style="color: var(--accent-green);">{cohort.morale}%</span> | 
              Năng suất: <span style="color: var(--accent-blue);">{cohort.productivity}%</span>
            </div>
          </div>
        {/each}
      </section>
    </div>

    <!-- Right Column: Audit Log & Blueprint Catalog -->
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- Công trình có sẵn trong bản vẽ -->
      <section class="card">
        <h2 style="font-size: 1.1rem; margin-bottom: 12px; color: #fff;">Bản vẽ Công trình Khả dụng</h2>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          {#each Content.buildings as b}
            <div style="background: var(--bg-tertiary); padding: 10px; border-radius: 6px; font-size: 0.85rem;">
              <div style="font-weight: 600; color: var(--accent-gold);">{b.name}</div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">{b.description}</div>
            </div>
          {/each}
        </div>
      </section>

      <!-- Nhật ký Nhân quả (Explanation Log) -->
      <section class="card" style="flex: 1;">
        <h2 style="font-size: 1.1rem; margin-bottom: 12px; color: #fff;">Nhật ký Nhân quả (Audit Trail)</h2>
        <div style="max-height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
          {#each log as item}
            <div style="font-size: 0.8rem; color: var(--text-main); background: rgba(0,0,0,0.2); padding: 8px; border-left: 2px solid var(--accent-blue); border-radius: 2px;">
              {item}
            </div>
          {/each}
        </div>
      </section>
    </div>
  </div>
</main>
