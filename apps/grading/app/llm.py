import litellm
from litellm import Router
from app.config import settings

litellm.set_verbose = False
litellm.suppress_debug_info = True


def build_model_list() -> list[dict]:
    models = [
        {
            "model_name": "grader",
            "litellm_params": {
                "model": settings.llm_model,
                "api_base": settings.llm_api_base,
                "api_key": settings.llm_api_key,
                "timeout": settings.llm_timeout,
            },
        }
    ]
    if settings.llm_fallback_model:
        models.append(
            {
                "model_name": "grader",
                "litellm_params": {
                    "model": settings.llm_fallback_model,
                    "api_key": settings.llm_fallback_api_key,
                    "timeout": settings.llm_timeout,
                },
            }
        )
    return models


router = Router(
    model_list=build_model_list(),
    num_retries=settings.llm_retries,
    timeout=settings.llm_timeout,
)
