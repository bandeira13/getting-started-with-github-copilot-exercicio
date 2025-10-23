document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activityTemplate = document.getElementById("activity-template");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        // Clone the template card
        const card = activityTemplate.content.cloneNode(true);

        // Fill in the main data
        card.querySelector(".activity-title").textContent = name;
        card.querySelector(".activity-desc").textContent = details.description;
        card.querySelector(".activity-schedule").innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        const spotsLeft = details.max_participants - details.participants.length;
        card.querySelector(".activity-capacity").innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        // Fill in participants
        const participantsList = card.querySelector(".participants-list");
        const noParticipantsMsg = card.querySelector(".no-participants");
        participantsList.innerHTML = "";

        if (details.participants.length > 0) {
          details.participants.forEach(email => {
            const li = document.createElement("li");
            li.className = "participant-item";
            
            // Criar o elemento de texto para o email
            const emailSpan = document.createElement("span");
            emailSpan.textContent = email;
            li.appendChild(emailSpan);
            
            // Criar o ícone de exclusão
            const deleteIcon = document.createElement("span");
            deleteIcon.innerHTML = "&#x2716;"; // X symbol
            deleteIcon.className = "delete-icon";
            deleteIcon.title = "Unregister from activity";
            
            // Adicionar evento de clique para cancelar o registro
            deleteIcon.addEventListener("click", async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`,
                  {
                    method: "POST",
                  }
                );

                const result = await response.json();

                if (response.ok) {
                  messageDiv.textContent = result.message || "Successfully unregistered from activity";
                  messageDiv.className = "success";
                  // Recarregar a lista de atividades
                  fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || "Failed to unregister from activity";
                  messageDiv.className = "error";
                }

                messageDiv.classList.remove("hidden");

                // Ocultar a mensagem após 5 segundos
                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 5000);

              } catch (error) {
                messageDiv.textContent = "Failed to unregister. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error unregistering:", error);
              }
            });
            
            li.appendChild(deleteIcon);
            participantsList.appendChild(li);
          });
          participantsList.classList.remove("hidden");
          noParticipantsMsg.classList.add("hidden");
        } else {
          participantsList.classList.add("hidden");
          noParticipantsMsg.classList.remove("hidden");
        }

        activitiesList.appendChild(card);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Atualizar a lista de atividades após registro bem-sucedido
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
