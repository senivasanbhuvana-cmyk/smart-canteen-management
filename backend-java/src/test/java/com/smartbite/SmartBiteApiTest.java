package com.smartbite;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:sqlite:./canteen_test.db",
    "server.port=5000"
})
class SmartBiteApiTest {

    @Autowired
    MockMvc mvc;

    @Test
    void healthCheck() throws Exception {
        mvc.perform(get("/api/health"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void listFoods() throws Exception {
        mvc.perform(get("/api/foods"))
           .andExpect(status().isOk())
           .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void listCategories() throws Exception {
        mvc.perform(get("/api/foods/categories"))
           .andExpect(status().isOk());
    }

    @Test
    void registerAndLogin() throws Exception {
        String ts = String.valueOf(System.currentTimeMillis());
        String regBody = """
            {"name":"Test User","email":"test%s@test.com","studentId":"TS%s","password":"pass1234"}
            """.formatted(ts, ts);

        String regResult = mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(regBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andReturn().getResponse().getContentAsString();

        // Login with same credentials
        String loginBody = """
            {"email":"test%s@test.com","password":"pass1234"}
            """.formatted(ts);

        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").exists())
            .andExpect(jsonPath("$.user.role").value("student"));
    }

    @Test
    void loginWithWrongPassword() throws Exception {
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"admin@smartbite.com","password":"wrongpass"}
                    """))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void adminLoginWorks() throws Exception {
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"admin@smartbite.com","password":"admin123"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.user.role").value("admin"));
    }

    @Test
    void unauthenticatedCannotAccessOrders() throws Exception {
        mvc.perform(get("/api/orders/my-orders"))
           .andExpect(status().is(403));
    }

    @Test
    void unauthenticatedCannotAccessAdmin() throws Exception {
        mvc.perform(get("/api/admin/stats"))
           .andExpect(status().is(403));
    }
}
