// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Local;
use rquickjs::{Context, Runtime};
use serde::Serialize;
use serde_json::Value as JsonValue;

#[derive(Serialize)]
pub struct Student {
    pub name: String,
    pub age: i32,
}

#[derive(Serialize)]
pub struct Results<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: String,
}

impl<T> Results<T> {
    pub fn success(data: T) -> Results<T> {
        Results {
            success: true,
            data: Some(data),
            message: "".to_string(),
        }
    }
    pub fn failure<M: Into<String>>(message: M) -> Results<T> {
        Results {
            success: false,
            data: None,
            message: message.into(),
        }
    }
}

#[tauri::command(async)]
fn greet(name: &str) -> Results<Student> {
    // 打印开始时间
    println!("rust get function call: {}", Local::now().format("%FT%T"));
    Results::success(Student {
        name: name.to_string(),
        age: 18,
    })
}

/// 将 rquickjs 的 Value 转换为 serde_json 的 Value
fn js_value_to_json(ctx: &rquickjs::Ctx<'_>, value: rquickjs::Value<'_>) -> JsonValue {
    use rquickjs::Type;

    match value.type_of() {
        Type::Undefined | Type::Uninitialized => JsonValue::Null,
        Type::Null => JsonValue::Null,
        Type::Bool => {
            if let Some(b) = value.as_bool() {
                JsonValue::Bool(b)
            } else {
                JsonValue::Null
            }
        }
        Type::Int => {
            if let Some(i) = value.as_int() {
                JsonValue::Number(i.into())
            } else {
                JsonValue::Null
            }
        }
        Type::Float => {
            if let Some(f) = value.as_float() {
                if let Some(n) = serde_json::Number::from_f64(f) {
                    JsonValue::Number(n)
                } else {
                    JsonValue::Null
                }
            } else {
                JsonValue::Null
            }
        }
        Type::String => {
            if let Some(s) = value.as_string() {
                if let Ok(str_val) = s.to_string() {
                    JsonValue::String(str_val)
                } else {
                    JsonValue::Null
                }
            } else {
                JsonValue::Null
            }
        }
        Type::Array => {
            if let Some(arr) = value.as_array() {
                let mut vec = Vec::new();
                for i in 0..arr.len() {
                    if let Ok(item) = arr.get::<rquickjs::Value>(i) {
                        vec.push(js_value_to_json(ctx, item));
                    }
                }
                JsonValue::Array(vec)
            } else {
                JsonValue::Null
            }
        }
        Type::Object => {
            if let Some(obj) = value.as_object() {
                let mut map = serde_json::Map::new();
                for prop in obj.props::<String, rquickjs::Value>() {
                    if let Ok((key, val)) = prop {
                        map.insert(key, js_value_to_json(ctx, val));
                    }
                }
                JsonValue::Object(map)
            } else {
                JsonValue::Null
            }
        }
        _ => JsonValue::Null,
    }
}

/// 执行 JS 代码并获取指定变量的值
#[tauri::command(async)]
fn execute_js_get_variable(js_code: String, variable_name: String) -> Results<JsonValue> {
    let rt = match Runtime::new() {
        Ok(rt) => rt,
        Err(e) => return Results::failure(format!("创建 JS 运行时失败: {}", e)),
    };

    let ctx = match Context::full(&rt) {
        Ok(ctx) => ctx,
        Err(e) => return Results::failure(format!("创建 JS 上下文失败: {}", e)),
    };

    ctx.with(|ctx| {
        // 执行 JS 代码
        if let Err(e) = ctx.eval::<(), _>(js_code.as_str()) {
            return Results::failure(format!("执行 JS 代码失败: {}", e));
        }

        // 获取全局对象
        let globals = ctx.globals();

        // 获取指定变量
        match globals.get::<_, rquickjs::Value>(&variable_name) {
            Ok(value) => {
                let json_value = js_value_to_json(&ctx, value);
                Results::success(json_value)
            }
            Err(e) => Results::failure(format!("获取变量 '{}' 失败: {}", variable_name, e)),
        }
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![greet, execute_js_get_variable])
        .setup(move |app| {
            let _main_window_result = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("genshin-planner")
            .center()
            .visible(true)
            .maximized(true)
            .build();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
